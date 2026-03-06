from sqlalchemy import Column, Integer, String, DateTime, Float
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Document(Base):
    __tablename__ = 'documents'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    size = Column(Float)
    content_type = Column(String)
    path = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    owner_id = Column(Integer, nullable=True)
    last_modified_by = Column(String, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'size': self.size,
            'content_type': self.content_type,
            'path': self.path,
            'created_at': self.created_at.isoformat(),
            'owner_id': self.owner_id,
            'last_modified_by': self.last_modified_by
        }