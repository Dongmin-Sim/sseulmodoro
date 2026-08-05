from watermark import read_watermark, update_watermark


class TestReadWatermark:
    def test_최신_워터마크를_반환한다(self, gcp_client):
        gcp_client.query.return_value.result.return_value = [("200",)]

        result = read_watermark(gcp_client, "test_tbl")

        assert result == "200"

    def test_워터마크가_없으면_None을_반환한다(self, gcp_client):
        gcp_client.query.return_value.result.return_value = []

        result = read_watermark(gcp_client, "test_tbl")

        assert result is None


class TestUpdateWatermark:
    def test_source와_watermark를_파라미터로_전달한다(self, gcp_client):
        update_watermark(gcp_client, "activity_log", "200")

        _, kwargs = gcp_client.query.call_args
        params = {p.name: p.value for p in kwargs["job_config"].query_parameters}
        assert params == {"table_name": "activity_log", "watermark": "200"}
