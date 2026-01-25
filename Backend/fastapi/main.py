# FASTAPI ENTRY POINT IS FROM HERE

from fastapi import FastAPI
from routers import problems

app = FastAPI(title="Code Stream API")

app.include_router(problems.router)

@app.get("/")
def root():
    return {"status": "FastAPI running"}
