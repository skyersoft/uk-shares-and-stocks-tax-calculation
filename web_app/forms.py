"""
Forms for the UK Capital Gains Tax Calculator web application.
"""
from datetime import datetime
from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileRequired, FileAllowed
from wtforms import StringField, SelectField, SubmitField
from wtforms.validators import DataRequired


def get_tax_year_choices():
    """Get available tax year choices."""
    current_year = datetime.now().year
    tax_years = []
    for year in range(current_year - 5, current_year + 2):
        tax_year = f"{year}-{year+1}"
        tax_years.append((tax_year, tax_year))
    return tax_years


class UploadForm(FlaskForm):
    """Form for file upload and calculation options."""
    file = FileField('QFX/CSV File', validators=[
        FileRequired(),
        FileAllowed(['qfx', 'csv'], 'QFX or CSV files only!')
    ])
    tax_year = SelectField('Tax Year', choices=get_tax_year_choices(), validators=[DataRequired()])
    output_format = SelectField('Output Format', choices=[
        ('csv', 'CSV'),
        ('json', 'JSON')
    ], default='csv')
    submit = SubmitField('Calculate')
