# Examples

This folder contains an Iris dataset analysis example and a LaTeX report.

## Files

- `iris_analysis.py` — runs analysis on the built-in scikit-learn Iris dataset.
- `iris_results.json` — model metrics and dataset-level summary values.
- `iris_overall_summary.csv` — descriptive statistics for numeric features.
- `iris_species_means.csv` — mean feature values by species.
- `iris_correlation.csv` — correlation matrix of numeric features.
- `iris_report.tex` — LaTeX report based on the analysis outputs.

## How to run

From project root:

```bash
python examples/iris_analysis.py
```

## How to build the PDF report

If you have a LaTeX distribution installed:

```bash
pdflatex -output-directory examples examples/iris_report.tex
```

This creates `examples/iris_report.pdf`.
