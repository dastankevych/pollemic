class DatabaseError(Exception):
    """Base class for database exceptions"""
    pass


class NotFoundError(DatabaseError):
    """Raised when an entity is not found in database"""
    pass


class DuplicateError(DatabaseError):
    """Raised when trying to create a duplicate entry"""
    pass 