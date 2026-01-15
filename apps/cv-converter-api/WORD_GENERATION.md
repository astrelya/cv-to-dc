# 📄 Word Document Generation Feature

Generate professional Word documents from your CV data using customizable templates!

## 🚀 Overview

This feature allows you to:

1. **Upload CV files** (PDF/Images) and extract structured data with AI
2. **Create Word templates** with placeholders for dynamic content
3. **Generate professional documents** by combining templates with CV data
4. **Download formatted Word documents** ready for use

## 🛠️ How It Works

```
CV File → AI Processing → Structured Data → Word Template → Generated Document
```

1. **CV Processing**: Upload PDF/image files, extract data with OpenAI
2. **Template Creation**: Design Word templates with placeholders
3. **Document Generation**: Combine data with templates automatically
4. **Download**: Get professional Word documents instantly

## 📋 API Endpoints

### Generate Document from CV Data

```http
POST /api/documents/generate-from-cv
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "templateName": "cv-template.docx",
  "cvId": "your-processed-cv-id",
  "outputName": "John_Doe_Resume"
}
```

**Response**: Word document download

### Generate Document with Custom Data

```http
POST /api/documents/generate-custom
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "templateName": "custom-template.docx",
  "data": {
    "fullName": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+1-555-0123",
    "summary": "Experienced software developer with 5+ years...",
    "experience": [
      {
        "title": "Senior Developer",
        "company": "Tech Corp",
        "location": "San Francisco, CA",
        "start_date": "2020-01",
        "end_date": "Present",
        "description": "Lead development of microservices...",
        "technologies": ["Node.js", "React", "AWS"]
      }
    ],
    "skills": {
      "cloud": ["AWS", "Azure", "Docker"],
      "scripting": ["JavaScript", "Python", "TypeScript"]
    }
  }
}
```

### List Available Templates

```http
GET /api/documents/templates
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response**:

```json
{
  "templates": ["cv-template.docx", "cover-letter-template.docx", "technical-resume.docx"]
}
```

## 📝 Creating Word Templates

### Step 1: Design Your Template

1. Open Microsoft Word
2. Create a new document
3. Design the layout with proper formatting
4. Add placeholder text where data should appear

### Step 2: Add Placeholders

#### Basic Placeholders (Single Values)

```
{fullName} → John Doe
{email} → john@example.com
{phone} → +1-555-0123
{summary} → Professional summary text...
```

#### Loops for Repeating Sections

```
Work Experience:
{#experience}
{title} at {company}
{location} | {start_date} - {end_date}
{description}
{/experience}
```

#### Conditional Sections (Show Only If Data Exists)

```
{#linkedin}
LinkedIn: {linkedin}
{/linkedin}
```

#### Arrays/Lists

```
Technical Skills:
{#skills.technical}
• {.}
{/skills.technical}
```

### Step 3: Save Template

- Save as `.docx` format
- Place in `apps/cv-converter-api/templates/` directory
- Use descriptive names like `cv-template.docx`

## 🎯 Available Data Fields

### Personal Information

- `{fullName}` - Full name
- `{email}` - Email address
- `{phone}` - Phone number
- `{address}` - Physical address
- `{linkedin}` - LinkedIn profile URL
- `{github}` - GitHub profile URL
- `{website}` - Personal website URL

### Professional Details

- `{headline}` - Professional headline/title
- `{years_experience}` - Years of experience
- `{summary}` - Professional summary/bio

### Experience (Loop: `{#experience}...{/experience}`)

- `{title}` - Job title
- `{company}` - Company name
- `{location}` - Work location
- `{start_date}` - Start date
- `{end_date}` - End date
- `{description}` - Job description
- `{technologies}` - Array of technologies used
- `{responsibilities}` - Array of responsibilities
- `{achievements}` - Array of achievements

### Education (Loop: `{#education}...{/education}`)

- `{degree}` - Degree name
- `{field}` - Field of study
- `{institution}` - Institution name
- `{start_date}` / `{end_date}` - Date range
- `{year}` - Graduation year (legacy schema)
- `{gpa}` - GPA (if available)
- `{honors}` - Array of honors/achievements

### Skills (Multiple Categories)

**PDF/Custom Schema:**

- `{skills.cloud}` - Cloud technologies
- `{skills.containers}` - Container technologies
- `{skills.orchestration}` - Orchestration tools
- `{skills.iac}` - Infrastructure as Code
- `{skills.ci_cd}` - CI/CD tools
- `{skills.scripting}` - Programming languages
- `{skills.databases_cache}` - Databases & caching
- `{skills.other_tools}` - Other tools

**Image/Legacy Schema:**

- `{skills.technical}` - Technical skills
- `{skills.tools}` - Tools & technologies
- `{skills.languages}` - Programming languages
- `{skills.soft}` - Soft skills

### Projects (Loop: `{#projects}...{/projects}`)

- `{name}` - Project name
- `{role}` - Role in project
- `{organization}` - Organization/company
- `{description}` - Project description
- `{highlights}` - Array of key achievements
- `{tech_stack}` - Array of technologies used
- `{start_date}` / `{end_date}` - Project timeline

### Other Sections

- `{#certifications}...{/certifications}` - Certifications
- `{#languages}...{/languages}` - Languages & proficiency
- `{#awards}...{/awards}` - Awards & recognition
- `{generatedDate}` - Document generation date

## 💡 Template Examples

### Basic CV Template

```
{fullName}
{email} | {phone}
{address}

PROFESSIONAL SUMMARY
{summary}

WORK EXPERIENCE
{#experience}
{title} | {company} | {location}
{start_date} - {end_date}

{description}

{/experience}

TECHNICAL SKILLS
{#skills.scripting}Programming: {#.}{.}, {/.}{/skills.scripting}
{#skills.cloud}Cloud: {#.}{.}, {/.}{/skills.cloud}
```

### Technical Resume Template

```
{fullName}
Senior {headline}

Contact: {email} | {phone}
Portfolio: {github} | {linkedin}

TECHNICAL EXPERTISE ({years_experience} years)

{#skills.cloud}
Cloud Platforms: {#.}{.} | {/.}
{/skills.cloud}

{#skills.containers}
Containerization: {#.}{.} | {/.}
{/skills.containers}

{#skills.scripting}
Programming: {#.}{.} | {/.}
{/skills.scripting}

PROFESSIONAL EXPERIENCE
{#experience}
{title} @ {company}
{location} | {start_date} - {end_date}

{description}

Key Technologies: {#technologies}{.} • {/technologies}

{/experience}
```

## 🔧 Usage Examples

### 1. Process CV and Generate Document

```javascript
// 1. Upload and process CV
POST /api/cv/upload
// Get CV ID from response

// 2. Generate Word document
POST /api/documents/generate-from-cv
{
  "templateName": "cv-template.docx",
  "cvId": "cv-123-abc",
  "outputName": "John_Doe_Resume"
}
// Downloads: John_Doe_Resume.docx
```

### 2. Generate with Custom Data

```javascript
POST /api/documents/generate-custom
{
  "templateName": "cover-letter-template.docx",
  "data": {
    "fullName": "Sarah Johnson",
    "email": "sarah@example.com",
    "companyName": "TechCorp Inc.",
    "position": "Senior Developer",
    "customMessage": "I am excited to apply for the Senior Developer position..."
  }
}
```

## 🚨 Troubleshooting

### Common Issues

**Template Not Found**

- Ensure template file exists in `apps/cv-converter-api/templates/`
- Check exact filename spelling (case-sensitive)
- Verify file is `.docx` format

**Missing Data in Output**

- Check placeholder names match data structure exactly
- Use conditional sections for optional fields: `{#field}...{/field}`
- Verify CV was processed successfully before generation

**Formatting Issues**

- Use proper Word formatting in template (don't rely on placeholders for styling)
- Test template with sample data first
- Check loop syntax: `{#section}...{/section}`

**Empty Sections**

- Wrap optional sections in conditionals
- Use arrays properly: `{#array}{.}{/array}`
- Check data structure in API response

### Debug Mode

Enable detailed logging in development:

```bash
# Check server logs for detailed error information
nx serve cv-converter-api
```

## 🎨 Best Practices

### Template Design

1. **Professional Formatting**: Use Word styles, consistent fonts
2. **Conditional Sections**: Hide empty sections gracefully
3. **Responsive Layout**: Design for different content lengths
4. **Test Thoroughly**: Try with different CV data structures

### Data Handling

1. **Validation**: Check data completeness before generation
2. **Fallbacks**: Provide default values for missing fields
3. **Sanitization**: Clean data for professional presentation

### Performance

1. **Template Size**: Keep templates reasonably sized
2. **Caching**: Consider template caching for repeated use
3. **Error Handling**: Graceful degradation for missing data

## 🔗 Integration with Frontend

Add document generation to your frontend:

```typescript
// Angular service method
generateDocument(cvId: string, templateName: string): Observable<Blob> {
  return this.http.post(`${this.apiUrl}/documents/generate-from-cv`,
    { templateName, cvId, outputName: 'Generated_CV' },
    {
      responseType: 'blob',
      headers: this.getAuthHeaders()
    }
  );
}

// Component usage
downloadCV(cvId: string) {
  this.cvService.generateDocument(cvId, 'cv-template.docx')
    .subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'My_CV.docx';
      a.click();
      window.URL.revokeObjectURL(url);
    });
}
```

---

## 🎉 Ready to Use!

Your Word document generation system is now ready!

1. **Create templates** in `apps/cv-converter-api/templates/`
2. **Upload CVs** through your app
3. **Generate professional documents** instantly
4. **Download and use** your formatted Word documents

The system works with both PDF (detailed technical analysis) and image CV processing, giving you maximum flexibility for document generation! 🚀
