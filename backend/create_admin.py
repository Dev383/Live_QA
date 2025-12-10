import asyncio
from sqlalchemy import select, update
from app.database import AsyncSessionLocal, init_db
from app.models import User
from app.auth import get_password_hash

async def create_admin():
    await init_db()
    
    async with AsyncSessionLocal() as session:
        
        result = await session.execute(select(User).filter(User.email == "admin@hemut.com"))
        admin = result.scalar_one_or_none()
        
        if not admin:
            
            admin = User(
                username="admin",
                email="admin@hemut.com",
                password_hash=get_password_hash("admin123"),
                is_admin=True
            )
            session.add(admin)
            await session.commit()
        else:

            admin.is_admin = True
            await session.commit()

            
            
if __name__ == "__main__":
    asyncio.run(create_admin())