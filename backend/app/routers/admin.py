from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List
from app.database import get_db
from app.models import User, Question, Answer, QuestionStatus
from app.schemas import QuestionResponse, BulkAnswerRequest, GroupedQuestionsResponse
from app.dependencies import get_current_user, get_current_admin
from app.services.clustering import ClusterService
import uuid
from datetime import datetime

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(get_current_admin)]
)

cluster_service = ClusterService()

@router.get("/grouped-questions", response_model=List[GroupedQuestionsResponse])
async def get_grouped_questions(db: Session = Depends(get_db)):
    """
    Get all pending questions grouped by similarity.
    """
    # Fetch all pending questions with relationships
    from sqlalchemy.orm import selectinload
    
    query = (
        select(Question)
        .where(Question.status == QuestionStatus.PENDING)
        .options(selectinload(Question.user))
        .options(selectinload(Question.answers))
    )
    result = await db.execute(query)
    questions = result.scalars().all()
    
    # Group them
    grouped = cluster_service.group_questions(questions)
    
    # Serialize the questions to match QuestionResponse schema
    for group in grouped:
        serialized_questions = []
        for q in group["questions"]:
            q_dict = {
                "question_id": q.question_id,
                "user_id": q.user_id,
                "username": q.user.username if q.user else "Guest",
                "message": q.message,
                "status": q.status,
                "timestamp": q.timestamp,
                "answers": [] # Use default empty list as pending questions shouldn't have answers usually
            }
            serialized_questions.append(q_dict)
        group["questions"] = serialized_questions
    
    return grouped

@router.post("/bulk-answer")
async def bulk_answer_questions(
    request: BulkAnswerRequest,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Answer multiple questions at once.
    """
    try:
        # Verify questions existence and status
        query = select(Question).where(Question.question_id.in_(request.question_ids))
        result = await db.execute(query)
        questions = result.scalars().all()
        
        if not questions:
            raise HTTPException(status_code=404, detail="No questions found")
            
        timestamp = datetime.utcnow()
        new_answers = []
        
        for question in questions:
            if question.status == QuestionStatus.ANSWERED:
                continue
                
            # Create Answer
            answer = Answer(
                answer_id=str(uuid.uuid4()),
                question_id=question.question_id,
                user_id=current_user.user_id,
                message=request.answer,
                timestamp=timestamp
            )
            new_answers.append(answer)
            
            # Update Question Status
            question.status = QuestionStatus.ANSWERED
            
        db.add_all(new_answers)
        await db.commit()
        
        return {"message": f"Successfully answered {len(new_answers)} questions"}
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
