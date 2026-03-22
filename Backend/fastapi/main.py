from fastapi import FastAPI
from routers import problems
from api import execute, websocket

app = FastAPI(title="Code Stream API")

# REST routes
app.include_router(problems.router, tags=["Problems"])
app.include_router(execute.router, tags=["Execution"])

# WebSocket route
app.include_router(websocket.router, tags=["WebSocket"])


@app.get("/")
def root():
    return {"status": "CodeStream API running"}