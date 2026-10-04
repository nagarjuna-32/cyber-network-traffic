"""Unified attack simulator: combines all synthetic traffic generators.

This module provides a single entry point to generate multi-scenario network
traffic traces for the NetForecast AI pipeline. All data is fully synthetic;
no real packets are transmitted and no external systems are contacted.

Usage:
    python -m simulation.attack_simulator --rows 50000 --output data/simulated/traffic.csv
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Literal

import numpy as np
import pandas as pd

from .common import COLUMNS, make_flow
from .normal import generate_normal
from .ddos import generate_ddos
from .beaconing import generate_beaconing
from .mixed_escalation import generate_mixed
from .scanning import generate_scanning
from .syn_flood import generate_syn_flood
from .udp_attack import generate_udp_attack


SCENARIO_GENERATORS = {
    "normal": generate_normal,
    "ddos": generate_ddos,
    "beaconing": generate_beaconing,
    "mixed": generate_mixed,
    "scanning": generate_scanning,
    "syn_flood": generate_syn_flood,
    "udp_attack": generate_udp_attack,
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate synthetic multi-scenario network traffic for NetForecast AI"
    )
    parser.add_argument(
        "--rows",
        type=int,
        default=50000,
        help="Total number of flow records to generate across all scenarios",
    )
    parser.add_argument(
        "--scenarios",
        nargs="+",
        choices=list(SCENARIO_GENERATORS.keys()) + ["all"],
        default=["all"],
        help="Scenarios to include in the output",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("data/simulated/traffic.csv"),
        help="Output CSV path",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed for reproducibility",
    )
    parser.add_argument(
        "--min-len",
        type=int,
        default=10,
        help="Minimum sequence length per flow group",
    )
    parser.add_argument(
        "--max-len",
        type=int,
        default=30,
        help="Maximum sequence length per flow group",
    )
    return parser.parse_args()


def expand_scenarios(scenarios: list[str]) -> list[str]:
    if "all" in scenarios:
        return list(SCENARIO_GENERATORS.keys())
    return scenarios


def generate_all(
    rng: np.random.Generator,
    total_rows: int,
    scenarios: list[str],
    min_len: int,
    max_len: int,
) -> list[dict]:
    """Generate combined traffic from multiple scenarios."""
    rows_per_scenario = total_rows // len(scenarios)
    remainder = total_rows % len(scenarios)

    all_rows = []
    for i, scenario_name in enumerate(scenarios):
        gen = SCENARIO_GENERATORS[scenario_name]
        n_rows = rows_per_scenario + (1 if i < remainder else 0)
        sequences = gen(rng, n_rows, min_len, max_len)
        for seq in sequences:
            all_rows.extend(seq)

    rng.shuffle(all_rows)
    return all_rows


def add_tcp_flags(flow: dict, rng: np.random.Generator, scenario: str) -> dict:
    """Add TCP flag information to flow records for feature extraction compatibility."""
    protocol = flow.get("protocol", "TCP")
    if protocol != "TCP":
        flow["syn_count"] = 0
        flow["ack_count"] = 0
        flow["fin_count"] = 0
        flow["rst_count"] = 0
        flow["syn_ack_ratio"] = 0.0
        return flow

    state = flow.get("state", "NORMAL")
    packet_count = flow.get("packet_count", 1)

    if scenario == "normal" or state == "NORMAL":
        syn = max(1, int(rng.poisson(1.2)))
        ack = max(syn, int(rng.poisson(packet_count * 0.6)))
        fin = int(rng.poisson(0.3))
        rst = int(rng.poisson(0.05))
    elif state == "ELEVATED":
        syn = max(1, int(rng.poisson(3.0)))
        ack = max(syn, int(rng.poisson(packet_count * 0.4)))
        fin = int(rng.poisson(0.5))
        rst = int(rng.poisson(0.3))
    elif state == "SUSPICIOUS":
        syn = max(1, int(rng.poisson(8.0)))
        ack = max(syn, int(rng.poisson(packet_count * 0.25)))
        fin = int(rng.poisson(0.8))
        rst = int(rng.poisson(1.5))
    else:  # ATTACK
        syn = max(1, int(rng.poisson(25.0)))
        ack = max(syn, int(rng.poisson(packet_count * 0.1)))
        fin = int(rng.poisson(0.2))
        rst = int(rng.poisson(5.0))

    flow["syn_count"] = syn
    flow["ack_count"] = ack
    flow["fin_count"] = fin
    flow["rst_count"] = rst
    flow["syn_ack_ratio"] = round(syn / max(ack, 1), 4)
    return flow


def add_scan_features(flow: dict, rng: np.random.Generator) -> dict:
    """Add scanning-specific features (port diversity, unique destination ratio)."""
    flow["unique_dst_ports"] = int(rng.integers(1, 20))
    flow["unique_dst_ips"] = int(rng.integers(1, 50))
    flow["port_entropy"] = round(rng.uniform(0.5, 3.5), 4)
    return flow


def main() -> int:
    args = parse_args()
    scenarios = expand_scenarios(args.scenarios)

    rng = np.random.default_rng(args.seed)

    print(f"Generating {args.rows} rows across scenarios: {scenarios}")
    rows = generate_all(rng, args.rows, scenarios, args.min_len, args.max_len)

    # Add flow_id and timestamp
    timestamp = 0.0
    for i, row in enumerate(rows):
        row["flow_id"] = i
        row["timestamp"] = round(timestamp, 6)
        timestamp += rng.exponential(0.1)  # ~0.1s between flows on average
        
        scenario = row.get("scenario", "mixed")
        row = add_tcp_flags(row, rng, scenario)
        if scenario in ("ddos", "mixed", "scanning", "syn_flood", "udp_attack") and row.get("state") in ("SUSPICIOUS", "ATTACK"):
            row = add_scan_features(row, rng)

    df = pd.DataFrame(rows, columns=COLUMNS + ["syn_count", "ack_count", "fin_count", "rst_count", "syn_ack_ratio", "unique_dst_ports", "unique_dst_ips", "port_entropy"])

    args.output.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(args.output, index=False)
    print(f"Written {len(df)} rows to {args.output}")
    print(f"Scenarios distribution: {df['scenario'].value_counts().to_dict()}")
    print(f"States distribution: {df['state'].value_counts().to_dict()}")
    return 0


if __name__ == "__main__":
    sys.exit(main())