from pydantic import BaseModel

class LeadRequest(BaseModel):
    domain: str
    location: str
