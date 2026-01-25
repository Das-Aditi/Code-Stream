from fastapi import APIRouter
from db import problem_collection
from schemas import ProblemSchema

router = APIRouter()

@router.post("/problems")
def create_problem(problem: ProblemSchema):
    problem_collection.insert_one(problem.dict())
    return {"message": "Problem created successfully"}

@router.get("/problems")
def get_problems():
    problems = []
    for p in problem_collection.find():
        p["_id"] = str(p["_id"])
        problems.append(p)
    return problems
