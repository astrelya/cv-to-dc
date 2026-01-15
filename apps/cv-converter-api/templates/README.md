# Word Document Templates

This directory contains Word templates used for generating documents from CV data.

## How to Create a Word Template

### 1. Create a New Word Document

- Open Microsoft Word
- Create a new document
- Design your template layout (headers, sections, formatting)

### 2. Add Placeholders

Use curly braces `{placeholderName}` to mark where data should be inserted:

#### Personal Information

- `{fullName}` - Full name
- `{email}` - Email address
- `{phone}` - Phone number
- `{address}` - Physical address
- `{linkedin}` - LinkedIn URL
- `{github}` - GitHub URL
- `{website}` - Personal website URL

#### Professional Details

- `{headline}` - Professional headline
- `{years_experience}` - Years of experience
- `{summary}` - Professional summary/bio

#### Experience Section (Loop)

For repeating sections like work experience, use:

```
{#experience}
**{title}** at **{company}**
{location} | {start_date} - {end_date}

{description}

Technologies: {technologies}

{/experience}
```

#### Education Section (Loop)

```
{#education}
**{degree}** in {field}
{institution} | {start_date} - {end_date}
{/education}
```

#### Skills Section

For categorized skills (PDF/Custom schema):

```
**Cloud Technologies:** {skills.cloud}
**Containers:** {skills.containers}
**Programming:** {skills.scripting}
**Databases:** {skills.databases_cache}
```

For basic skills (Image/Legacy schema):

```
**Technical Skills:** {skills.technical}
**Tools:** {skills.tools}
```

#### Other Sections

- `{#projects}...{/projects}` - Projects loop
- `{#certifications}...{/certifications}` - Certifications loop
- `{#languages}...{/languages}` - Languages loop
- `{generatedDate}` - Document generation date

### 3. Advanced Formatting

#### Conditional Sections

```
{#summary}
## Professional Summary
{summary}
{/summary}
```

#### Nested Data

```
{#experience}
**{title}** - {company}
{#technologies}
• {.}
{/technologies}
{/experience}
```

#### Arrays/Lists

```
{#skills.technical}
• {.}
{/skills.technical}
```

### 4. Save Template

- Save the document as `template-name.docx` in this `templates` directory
- Use descriptive names like:
  - `cv-template.docx`
  - `cover-letter-template.docx`
  - `technical-resume.docx`

## Sample Template Structure

```
{fullName}
{email} | {phone}
{address}
{linkedin} | {github}

PROFESSIONAL SUMMARY
{summary}

WORK EXPERIENCE
{#experience}
{title} | {company} | {location}
{start_date} - {end_date}

{description}

Key Technologies: {#technologies}{.}, {/technologies}

{/experience}

EDUCATION
{#education}
{degree} in {field}
{institution} | {start_date} - {end_date}
{/education}

TECHNICAL SKILLS
{#skills.cloud}
Cloud: {#.}{.}, {/.}
{/skills.cloud}

{#skills.scripting}
Programming: {#.}{.}, {/.}
{/skills.scripting}

PROJECTS
{#projects}
{name}
{description}
Technologies: {#tech_stack}{.}, {/tech_stack}
{/projects}

Generated on: {generatedDate}
```

## API Usage

### Generate from CV Data

```bash
POST /api/documents/generate-from-cv
{
  "templateName": "cv-template.docx",
  "cvId": "your-cv-id",
  "outputName": "John_Doe_CV"
}
```

### Generate from Custom Data

```bash
POST /api/documents/generate-custom
{
  "templateName": "cv-template.docx",
  "data": {
    "fullName": "John Doe",
    "email": "john@example.com",
    "summary": "Experienced developer...",
    "skills": {
      "technical": ["JavaScript", "Python", "Docker"]
    }
  }
}
```

### List Available Templates

```bash
GET /api/documents/templates
```

## Tips for Better Templates

1. **Use consistent formatting** - Apply Word styles for headers, paragraphs
2. **Test with sample data** - Generate documents to verify layout
3. **Handle empty fields** - Use conditional sections for optional data
4. **Keep it professional** - Use appropriate fonts and spacing
5. **Consider page breaks** - Use manual breaks for long sections

## Troubleshooting

**Template not found:** Ensure the template file is in this directory with the correct name.

**Missing data:** Check that your placeholder names match the data structure.

**Formatting issues:** Verify that your loop syntax is correct (`{#section}...{/section}`).

**Empty sections:** Use conditional blocks to hide empty sections.

## Data Structure Reference

The complete data structure available for templates can be found in the API documentation at `/api` (Swagger UI) under the Document Generation section.
