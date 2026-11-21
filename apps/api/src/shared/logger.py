import logging

_FORMAT = "%(asctime)s | %(levelname)s | %(name)s | %(message)s"
_console_handler = logging.StreamHandler()
_console_handler.setFormatter(logging.Formatter(_FORMAT))


def setup_logging() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format=_FORMAT,
    )


class Logger(logging.LoggerAdapter[logging.Logger]):
    def __init__(self, name: str) -> None:
        logger = logging.getLogger(name)
        logger.setLevel(logging.INFO)
        logger.addHandler(_console_handler)
        logger.propagate = False
        super().__init__(logger)
