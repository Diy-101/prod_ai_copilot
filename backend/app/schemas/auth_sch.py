from pydantic import AliasChoices, BaseModel, ConfigDict, EmailStr, Field


class RegisterIn(BaseModel):
    email: EmailStr = Field(max_length=254)
    password: str = Field(min_length=1, max_length=72)
    full_name: str = Field(
        min_length=2,
        max_length=200,
        validation_alias=AliasChoices("full_name", "fullName"),
        serialization_alias="fullName",
    )

    model_config = ConfigDict(populate_by_name=True)


class LoginIn(BaseModel):
    email: EmailStr = Field(max_length=254)
    password: str = Field(min_length=1, max_length=72)
