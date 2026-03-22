from pydantic import BaseModel
from typing import Optional, List


class TestCase(BaseModel):
    input: str
    expected_output: str


class ProblemSchema(BaseModel):
    title: str
    description: str
    difficulty: str  # "Easy" | "Medium" | "Hard"
    sample_input: Optional[str] = None
    sample_output: Optional[str] = None
    test_cases: List[TestCase] = []   # Hidden test cases used for judging
    time_limit: int = 5               # seconds
    memory_limit: int = 128           # MB


class SubmissionSchema(BaseModel):
    problem_id: str
    language: str
    code: str
    user_id: Optional[str] = None