from typing import List, Literal, Optional
from pydantic import BaseModel, Field


AuthMethod = Literal[
    "oauth2",
    "api_key",
    "basic",
    "bearer_token",
    "personal_access_token",
    "other",
    "unknown",
]

CredentialAccess = Literal[
    "self_serve_free",
    "self_serve_trial",
    "self_serve_paid",
    "admin_approval",
    "contact_sales",
    "partner_only",
    "unknown",
]

APIType = Literal[
    "rest",
    "graphql",
    "rest_and_graphql",
    "other",
    "none",
    "unknown",
]

APIBreadth = Literal[
    "broad",
    "moderate",
    "narrow",
    "limited",
    "none",
    "unknown",
]

MCPStatus = Literal[
    "official",
    "official_experimental",
    "third_party",
    "community",
    "none_found",
    "unknown",
]

BuildabilityVerdict = Literal[
    "easy_win",
    "buildable_with_friction",
    "blocked",
    "unknown",
]

Confidence = Literal[
    "high",
    "medium",
    "low",
]


class Evidence(BaseModel):
    claim: str = Field(
        description="The specific claim supported by this evidence."
    )
    url: str = Field(
        description="URL of the documentation or source supporting the claim."
    )
    source_type: Literal[
        "official_docs",
        "official_blog",
        "official_github",
        "official_mcp",
        "third_party",
        "other",
    ] = "official_docs"


class AuthInfo(BaseModel):
    methods: List[AuthMethod]
    evidence: List[Evidence]


class CredentialAccessInfo(BaseModel):
    status: CredentialAccess
    evidence: List[Evidence]


class APIInfo(BaseModel):
    types: List[APIType]
    breadth: APIBreadth
    evidence: List[Evidence]


class MCPInfo(BaseModel):
    status: MCPStatus
    evidence: List[Evidence]


class BuildabilityInfo(BaseModel):
    verdict: BuildabilityVerdict
    blocker: Optional[str] = None


class ComposioInfo(BaseModel):
    toolkit_exists: Optional[bool]
    evidence: List[Evidence]


class AppResearchResult(BaseModel):
    id: int
    app: str
    category: str
    description: str

    auth: AuthInfo
    credential_access: CredentialAccessInfo
    api: APIInfo
    mcp: MCPInfo

    buildability: BuildabilityInfo
    composio: ComposioInfo

    confidence: Confidence
    research_notes: Optional[str] = None


class ResearchResults(BaseModel):
    results: List[AppResearchResult]