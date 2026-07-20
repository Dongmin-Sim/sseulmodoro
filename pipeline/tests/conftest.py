import pytest
from unittest.mock import Mock

@pytest.fixture
def gcp_client() -> Mock:
    client = Mock()
    client.project = "test"
    return client