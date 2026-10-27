import ipaddress
from typing import Optional
from backend.app.schemas.ip_validation import IPValidationResponse


class IPValidatorService:
    @staticmethod
    def validate_ip_or_prefix(
        input_value: str,
        expected_version: Optional[int] = None
    ) -> IPValidationResponse:
        trimmed = input_value.strip()
        if not trimmed:
            return IPValidationResponse(
                input_value=input_value,
                is_valid=False,
                error_message="IP address or prefix cannot be empty",
                details="Please enter a valid IPv4 or IPv6 host address or CIDR notation."
            )

        # Attempt 1: Interface notation (e.g. 192.168.1.1/24 or 2001:db8::1/64)
        try:
            interface = ipaddress.ip_interface(trimmed)
            version = interface.version
            if expected_version and version != expected_version:
                return IPValidationResponse(
                    input_value=trimmed,
                    is_valid=False,
                    version=version,
                    error_message=f"Expected IPv{expected_version} address, but received IPv{version} address.",
                    details=f"Input {trimmed} is recognized as IPv{version}, not IPv{expected_version}."
                )

            network = interface.network
            is_net_prefix = "/" in trimmed and (interface.ip == network.network_address)

            is_private = interface.is_private
            is_global = interface.is_global
            is_loopback = interface.is_loopback
            is_link_local = interface.is_link_local
            is_reserved = interface.is_reserved

            total_hosts = network.num_addresses
            # For IPv4 with netmask < 31, usable hosts is num_addresses - 2
            if version == 4 and network.prefixlen < 31:
                usable_hosts = max(0, total_hosts - 2)
            else:
                usable_hosts = total_hosts

            broadcast = str(network.broadcast_address) if version == 4 else "N/A (IPv6 uses all-nodes multicast ff02::1)"

            family_desc = (
                f"Valid IPv{version} {'network prefix' if is_net_prefix else 'host address'}. "
                f"Subnet: {network.with_prefixlen}, Netmask: {interface.netmask}."
            )
            if version == 4:
                family_desc += f" Total address space: {total_hosts} addresses ({usable_hosts} usable hosts)."
            else:
                family_desc += f" Prefix length: /{network.prefixlen}. IPv6 utilizes 128-bit addresses and eliminates broadcast in favor of multicast."

            return IPValidationResponse(
                input_value=trimmed,
                is_valid=True,
                version=version,
                is_network_prefix=is_net_prefix,
                ip_address=str(interface.ip),
                prefix_length=interface.network.prefixlen,
                netmask=str(interface.netmask),
                network_address=str(network.network_address),
                broadcast_address=broadcast,
                total_hosts=usable_hosts,
                is_private=is_private,
                is_global=is_global,
                is_loopback=is_loopback,
                is_link_local=is_link_local,
                is_reserved=is_reserved,
                details=family_desc
            )
        except ValueError as e1:
            # Attempt 2: Direct Network notation (e.g. 192.168.1.0/24 strict)
            try:
                network = ipaddress.ip_network(trimmed, strict=False)
                version = network.version
                if expected_version and version != expected_version:
                    return IPValidationResponse(
                        input_value=trimmed,
                        is_valid=False,
                        version=version,
                        error_message=f"Expected IPv{expected_version} prefix, but received IPv{version}.",
                        details=f"Input {trimmed} is recognized as IPv{version}."
                    )

                broadcast = str(network.broadcast_address) if version == 4 else "N/A (Multicast used in IPv6)"
                total_hosts = network.num_addresses
                usable_hosts = max(0, total_hosts - 2) if (version == 4 and network.prefixlen < 31) else total_hosts

                return IPValidationResponse(
                    input_value=trimmed,
                    is_valid=True,
                    version=version,
                    is_network_prefix=True,
                    ip_address=str(network.network_address),
                    prefix_length=network.prefixlen,
                    netmask=str(network.netmask),
                    network_address=str(network.network_address),
                    broadcast_address=broadcast,
                    total_hosts=usable_hosts,
                    is_private=network.is_private,
                    is_global=network.is_global,
                    is_loopback=network.is_loopback,
                    is_link_local=network.is_link_local,
                    is_reserved=network.is_reserved,
                    details=f"Valid IPv{version} CIDR network block /{network.prefixlen}."
                )
            except ValueError as e2:
                return IPValidationResponse(
                    input_value=trimmed,
                    is_valid=False,
                    error_message=f"Invalid IP address or CIDR notation: {str(e1)}",
                    details="Ensure the string adheres to standard dotted-decimal (IPv4, e.g., 192.168.1.1) or hexadecimal (IPv6, e.g., 2001:db8::1) formats with optional /prefix length."
                )
