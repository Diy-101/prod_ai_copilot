from fastapi import FastAPI
from app.api.ping.router import router as ping_router

app = FastAPI()

app.include_router(ping_router)
