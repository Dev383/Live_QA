from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List
from app.models import QuestionStatus

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Was UserOut, renamed back to UserResponse
class UserResponse(UserBase):
    user_id: str
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    user_id: Optional[str] = None

class AnswerBase(BaseModel):
    message: str = Field(..., min_length=1)

class AnswerCreate(AnswerBase):
    pass

class AnswerResponse(AnswerBase):
    answer_id: str
    question_id: str
    user_id: Optional[str]
    username: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True

class QuestionBase(BaseModel):
    message: str = Field(..., min_length=1)

class QuestionCreate(QuestionBase):
    pass

# Was QuestionOut, renamed back to QuestionResponse
class QuestionResponse(QuestionBase):
    question_id: str
    user_id: Optional[str]
    username: Optional[str]
    status: QuestionStatus
    timestamp: datetime
    answers: List[AnswerResponse] = []

    class Config:
        from_attributes = True

class QuestionUpdate(BaseModel):
    status: Optional[QuestionStatus] = None

# New schemas for Admin
class BulkAnswerRequest(BaseModel):
    question_ids: List[str]
    answer: str

class GroupedQuestionsResponse(BaseModel):
    title: str
    count: int
    questions: List[QuestionResponse]