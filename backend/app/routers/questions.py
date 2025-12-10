from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
import httpx
from app.database import get_db
from app.models import Question, Answer, User, QuestionStatus
from app.schemas import (
    QuestionCreate, 
    QuestionResponse, 
    AnswerCreate, 
    AnswerResponse
)
from app.dependencies import get_current_user, get_current_admin
from app.config import settings

router = APIRouter(prefix="/questions", tags=["Questions"])

active_connections = []

async def send_webhook(question_id: str, status: str):
    if not settings.WEBHOOK_URL:
        return
    
    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                settings.WEBHOOK_URL,
                json={
                    "event": "question_answered",
                    "question_id": question_id,
                    "status": status
                },
                timeout=5.0
            )
    except Exception as e:
        print(f"Webhook error: {e}")

@router.get("", response_model=List[QuestionResponse])
async def get_questions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all questions with answers"""
    result = await db.execute(
        select(Question)
        .options(selectinload(Question.answers).selectinload(Answer.user))
        .options(selectinload(Question.user))
        .order_by(Question.timestamp.desc())
    )
    questions = result.scalars().all()
    
    response = []
    for question in questions:
        question_dict = {
            "question_id": question.question_id,
            "user_id": question.user_id,
            "username": question.user.username if question.user else "Guest",
            "message": question.message,
            "status": question.status,
            "timestamp": question.timestamp,
            "answers": [
                {
                    "answer_id": answer.answer_id,
                    "question_id": answer.question_id,
                    "user_id": answer.user_id,
                    "username": answer.user.username if answer.user else "Guest",
                    "message": answer.message,
                    "timestamp": answer.timestamp
                }
                for answer in question.answers
            ]
        }
        response.append(QuestionResponse(**question_dict))
    
    return response

@router.post("", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
async def create_question(
    question_data: QuestionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_question = Question(
        message=question_data.message,
        user_id=current_user.user_id if current_user else None,
        status=QuestionStatus.PENDING
    )
    
    db.add(new_question)
    await db.commit()
    await db.refresh(new_question)
    
    result = await db.execute(
        select(Question)
        .options(selectinload(Question.user))
        .filter(Question.question_id == new_question.question_id)
    )
    new_question = result.scalar_one()
    
    # Prepare response
    response_data = {
        "question_id": new_question.question_id,
        "user_id": new_question.user_id,
        "username": new_question.user.username if new_question.user else "Guest",
        "message": new_question.message,
        "status": new_question.status,
        "timestamp": new_question.timestamp,
        "answers": []
    }
    
    print(f"Broadcasting new question: {new_question.question_id}")
    from app.routers.websocket import broadcast_message
    await broadcast_message({
        "type": "new_question",
        "data": response_data
    })
    
    return QuestionResponse(**response_data)

@router.patch("/{question_id}/answered", response_model=QuestionResponse)
async def mark_question_answered(
    question_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    result = await db.execute(
        select(Question)
        .options(selectinload(Question.user))
        .options(selectinload(Question.answers).selectinload(Answer.user))
        .filter(Question.question_id == question_id)
    )
    question = result.scalar_one_or_none()
    
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    question.status = QuestionStatus.ANSWERED
    await db.commit()
    await db.refresh(question)
    
    background_tasks.add_task(send_webhook, question_id, "Answered")
    
    response_data = {
        "question_id": question.question_id,
        "user_id": question.user_id,
        "username": question.user.username if question.user else "Guest",
        "message": question.message,
        "status": question.status,
        "timestamp": question.timestamp,
        "answers": [
            {
                "answer_id": answer.answer_id,
                "question_id": answer.question_id,
                "user_id": answer.user_id,
                "username": answer.user.username if answer.user else "Guest",
                "message": answer.message,
                "timestamp": answer.timestamp
            }
            for answer in question.answers
        ]
    }
    
    
    from app.routers.websocket import broadcast_message
    await broadcast_message({
        "type": "question_updated",
        "data": response_data
    })
    
    return QuestionResponse(**response_data)

@router.patch("/{question_id}/escalate", response_model=QuestionResponse)
async def escalate_question(
    question_id: str,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    
    result = await db.execute(
        select(Question)
        .options(selectinload(Question.user))
        .options(selectinload(Question.answers).selectinload(Answer.user))
        .filter(Question.question_id == question_id)
    )
    question = result.scalar_one_or_none()
    
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    question.status = QuestionStatus.ESCALATED
    await db.commit()
    await db.refresh(question)
    
    # Prepare response
    response_data = {
        "question_id": question.question_id,
        "user_id": question.user_id,
        "username": question.user.username if question.user else "Guest",
        "message": question.message,
        "status": question.status,
        "timestamp": question.timestamp,
        "answers": [
            {
                "answer_id": answer.answer_id,
                "question_id": answer.question_id,
                "user_id": answer.user_id,
                "username": answer.user.username if answer.user else "Guest",
                "message": answer.message,
                "timestamp": answer.timestamp
            }
            for answer in question.answers
        ]
    }
    
    from app.routers.websocket import broadcast_message
    await broadcast_message({
        "type": "question_updated",
        "data": response_data
    })
    
    return QuestionResponse(**response_data)

@router.post("/{question_id}/answers", response_model=AnswerResponse, status_code=status.HTTP_201_CREATED)
async def create_answer(
    question_id: str,
    answer_data: AnswerCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if question exists
    result = await db.execute(select(Question).filter(Question.question_id == question_id))
    question = result.scalar_one_or_none()
    
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    
    new_answer = Answer(
        question_id=question_id,
        user_id=current_user.user_id if current_user else None,
        message=answer_data.message
    )
    
    db.add(new_answer)
    await db.commit()
    await db.refresh(new_answer)
    
    
    result = await db.execute(
        select(Answer)
        .options(selectinload(Answer.user))
        .filter(Answer.answer_id == new_answer.answer_id)
    )
    new_answer = result.scalar_one()
    
    
    response_data = {
        "answer_id": new_answer.answer_id,
        "question_id": new_answer.question_id,
        "user_id": new_answer.user_id,
        "username": new_answer.user.username if new_answer.user else "Guest",
        "message": new_answer.message,
        "timestamp": new_answer.timestamp
    }
    
    from app.routers.websocket import broadcast_message
    await broadcast_message({
        "type": "new_answer",
        "data": {
            "question_id": question_id,
            "answer": response_data
        }
    })
    
    return AnswerResponse(**response_data)