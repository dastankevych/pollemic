from dataclasses import dataclass
from environs import Env


@dataclass
class AuthConfig:
    """
    Authentication configuration class.
    
    This class holds the settings for authentication, such as secret key, algorithm, and token expiration.
    
    Attributes
    ----------
    secret_key : str
        The secret key used to sign JWT tokens.
    algorithm : str
        The algorithm used for JWT token signing (default is HS256).
    access_token_expire_minutes : int
        The expiration time for access tokens in minutes (default is 60).
    """
    
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    
    @staticmethod
    def from_env(env: Env):
        """
        Creates the AuthConfig object from environment variables.
        """
        secret_key = env.str("SECRET_KEY")
        algorithm = env.str("ALGORITHM", "HS256")
        access_token_expire_minutes = env.int("ACCESS_TOKEN_EXPIRE_MINUTES", 60)
        
        return AuthConfig(
            secret_key=secret_key,
            algorithm=algorithm,
            access_token_expire_minutes=access_token_expire_minutes
        )