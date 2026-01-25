# data SCHEMA

from pydantic import BaseModel
from typing import Optional

class ProblemSchema(BaseModel):
    title: str
    description: str
    difficulty: str
    sample_input: Optional[str] = None
    sample_output: Optional[str] = None
