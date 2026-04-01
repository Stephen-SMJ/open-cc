"""
Iris dataset analysis example.

Run:
    python examples/iris_analysis.py
"""

from __future__ import annotations

import json
from pathlib import Path

import pandas as pd
from sklearn.datasets import load_iris
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler


def main() -> None:
    iris = load_iris(as_frame=True)
    df = iris.frame.copy()
    df["species"] = df["target"].map(dict(enumerate(iris.target_names)))

    feature_cols = iris.feature_names

    overall_summary = df[feature_cols].describe().round(3)
    per_species_means = df.groupby("species")[feature_cols].mean().round(3)
    corr = df[feature_cols].corr().round(3)

    X = df[feature_cols]
    y = df["species"]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000))
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    accuracy = accuracy_score(y_test, y_pred)
    cm = confusion_matrix(y_test, y_pred, labels=iris.target_names)
    clf_report = classification_report(
        y_test, y_pred, target_names=iris.target_names, output_dict=True
    )

    out_dir = Path("examples")
    out_dir.mkdir(parents=True, exist_ok=True)

    # Save machine-readable results.
    results = {
        "n_samples": int(df.shape[0]),
        "n_features": int(len(feature_cols)),
        "class_counts": df["species"].value_counts().to_dict(),
        "accuracy": round(float(accuracy), 4),
        "confusion_matrix": cm.tolist(),
        "labels": list(iris.target_names),
        "macro_f1": round(float(clf_report["macro avg"]["f1-score"]), 4),
        "weighted_f1": round(float(clf_report["weighted avg"]["f1-score"]), 4),
    }
    (out_dir / "iris_results.json").write_text(json.dumps(results, indent=2), encoding="utf-8")

    # Save convenient CSV tables for inspection.
    overall_summary.to_csv(out_dir / "iris_overall_summary.csv")
    per_species_means.to_csv(out_dir / "iris_species_means.csv")
    corr.to_csv(out_dir / "iris_correlation.csv")

    print("Saved:")
    print(" - examples/iris_results.json")
    print(" - examples/iris_overall_summary.csv")
    print(" - examples/iris_species_means.csv")
    print(" - examples/iris_correlation.csv")
    print(f"Model accuracy: {accuracy:.4f}")


if __name__ == "__main__":
    main()
