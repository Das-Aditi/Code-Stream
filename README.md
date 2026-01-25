# Code Stream
Summer Project focused on making a system where the coder can solve and see the real time solution of the provided problem.

## 📌 Project Overview

The platform enables users to write and execute code in a browser-based editor while receiving real-time feedback. Code submissions are securely executed in isolated environments and evaluated against predefined test cases. Administrators can manage users, problems, and test cases through a dedicated backend interface.

![alt text](<Overview.png>)

This project is inspired by real-world coding platforms and emphasizes clean architecture, security, and scalability.

## 🏗️ Architecture Overview

The system follows a service-oriented architecture with clear separation of responsibilities:

- **Frontend** handles live coding, problem display, and output rendering.
- **Django Backend** manages authentication, users, problems, and admin workflows.
- **FastAPI Backend** handles real-time code execution and WebSocket-based output streaming.
- **Docker Sandbox** ensures secure and isolated execution of untrusted user code.
- **MongoDB** stores problems, test cases, submissions, and execution results.

![alt text](<README ARCHITECTURE-1.png>)

Refer to the architecture diagram above for a visual representation.

## 🔁 System Communication Flow

1. The frontend communicates with Django via REST APIs for authentication and problem retrieval.
2. Code submissions are sent directly to FastAPI using REST or WebSockets.
3. FastAPI fetches relevant test cases from MongoDB.
4. User code is executed inside a Docker sandbox with controlled resources.
5. Execution output and evaluation results are streamed back to the frontend in real time.
6. Submission results are persisted in the database for tracking and review.

![alt text](<System Communication (1).png>)

## 🛠️ Technology Stack

- **Frontend:** React, CodeMirror  
- **Backend:** Django, FastAPI  
- **Database:** MongoDB  
- **Real-Time Communication:** WebSockets  
- **Execution Environment:** Docker  
- **Testing:** Pytest, Selenium  
- **Version Control:** Git, GitHub  

## 📄 Documentation

The project includes detailed documentation covering:
- System architecture
- API and low-level design
- Test plans and test cases
- Deployment strategy

## 🧠 Learning Outcomes

This project demonstrates practical experience in:
- Secure system design
- Backend service separation
- Real-time communication
- Containerized execution
- End-to-end software development lifecycle

## 📌 Status

This project is under active development and is designed to be extended for production-scale use.