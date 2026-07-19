CONTENT_STATUS_VALUES = ("draft", "published", "offline", "archived")
CATEGORY_TYPE_VALUES = ("article", "share", "project")
FILE_OWNER_TYPE_VALUES = (
    "article",
    "project",
    "friend_link",
    "share",
    "site_config",
    "gallery",
    "music",
)
COMMENT_STATUS_VALUES = ("pending", "visible", "hidden")


def sql_values(values: tuple[str, ...]) -> str:
    return ", ".join(f"'{value}'" for value in values)
