import secrets
import time
from sqlalchemy import delete
from .models import Session, AccountEvent
from .security import digest, PRODUCTION


def establish_session(db, response, user, action):
    raw, csrf = secrets.token_hex(32), secrets.token_hex(32)
    db.execute(delete(Session).where(Session.expires < int(time.time())))
    db.add(
        Session(
            token=digest(raw),
            user_id=user.id,
            csrf=csrf,
            expires=int(time.time()) + 28800,
        )
    )
    db.add(AccountEvent(user_id=user.id, actor_id=user.id, action=action))
    db.commit()
    response.set_cookie(
        "session",
        raw,
        httponly=True,
        secure=PRODUCTION,
        samesite="strict",
        max_age=28800,
    )
    return csrf
