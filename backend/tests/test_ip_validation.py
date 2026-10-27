from backend.app.services.ip_validator import IPValidatorService


def test_valid_ipv4_host():
    res = IPValidatorService.validate_ip_or_prefix("192.168.10.2", expected_version=4)
    assert res.is_valid is True
    assert res.version == 4
    assert res.ip_address == "192.168.10.2"
    assert res.prefix_length == 32
    assert res.is_private is True


def test_valid_ipv4_cidr():
    res = IPValidatorService.validate_ip_or_prefix("192.168.10.0/24", expected_version=4)
    assert res.is_valid is True
    assert res.version == 4
    assert res.is_network_prefix is True
    assert res.netmask == "255.255.255.0"
    assert res.broadcast_address == "192.168.10.255"
    assert res.total_hosts == 254


def test_valid_ipv6_host():
    res = IPValidatorService.validate_ip_or_prefix("2001:db8:10::2", expected_version=6)
    assert res.is_valid is True
    assert res.version == 6
    assert res.ip_address == "2001:db8:10::2"
    assert res.prefix_length == 128


def test_valid_ipv6_prefix():
    res = IPValidatorService.validate_ip_or_prefix("2001:db8:10::/64", expected_version=6)
    assert res.is_valid is True
    assert res.version == 6
    assert res.is_network_prefix is True
    assert res.prefix_length == 64
    assert "multicast" in res.broadcast_address.lower()


def test_invalid_ipv4_syntax():
    res = IPValidatorService.validate_ip_or_prefix("256.300.1.1")
    assert res.is_valid is False
    assert res.error_message is not None


def test_invalid_ipv6_syntax():
    res = IPValidatorService.validate_ip_or_prefix("2001:zzzz::1")
    assert res.is_valid is False
    assert res.error_message is not None


def test_expected_version_mismatch():
    res = IPValidatorService.validate_ip_or_prefix("192.168.1.1", expected_version=6)
    assert res.is_valid is False
    assert "Expected IPv6" in res.error_message


def test_empty_string():
    res = IPValidatorService.validate_ip_or_prefix("   ")
    assert res.is_valid is False
    assert "cannot be empty" in res.error_message
