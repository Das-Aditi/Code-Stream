from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import problems
from api import execute, websocket , trace

app = FastAPI(title="Code Stream API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(problems.router, tags=["Problems"])
app.include_router(execute.router, tags=["Execution"])
app.include_router(websocket.router, tags=["WebSocket"])
app.include_router(trace.router, tags=["Trace"])

@app.get("/")
def root():
    return {"status": "CodeStream API running"}