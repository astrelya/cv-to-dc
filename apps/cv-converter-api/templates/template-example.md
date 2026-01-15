# Word Template Example

This is what your Word template (`cv-template.docx`) should contain:

---

**{fullName}**

Email: {email} | Phone: {phone}
Address: {address}
LinkedIn: {linkedin} | GitHub: {github}

---

## PROFESSIONAL SUMMARY

{summary}

---

## WORK EXPERIENCE

{#experience}
**{title}** | {company}
{location} | {start_date} - {end_date}

{description}

{#technologies}Key Technologies Used:
{#.}• {.}
{/.}{/technologies}

{/experience}

---

## EDUCATION

{#education}
**{degree}** {#field}in {field}{/field}
{institution}
{#start_date}{start_date} - {end_date}{/start_date}{#year}{year}{/year}

{/education}

---

## TECHNICAL SKILLS

{#skills.cloud}**Cloud Technologies:** {#.}{.}, {/.}

{/skills.cloud}
{#skills.containers}**Containers:** {#.}{.}, {/.}

{/skills.containers}
{#skills.scripting}**Programming Languages:** {#.}{.}, {/.}

{/skills.scripting}
{#skills.databases_cache}**Databases:** {#.}{.}, {/.}

{/skills.databases_cache}
{#skills.technical}**Technical Skills:** {#.}{.}, {/.}

{/skills.technical}
{#skills.tools}**Tools & Technologies:** {#.}{.}, {/.}

{/skills.tools}

---

## PROJECTS

{#projects}
**{name}** {#role}| {role}{/role}
{#organization}{organization} | {/organization}{#start_date}{start_date} - {end_date}{/start_date}

{description}

{#highlights}Key Achievements:
{#.}• {.}
{/.}

{/highlights}
{#tech_stack}Technologies: {#.}{.}, {/.}

{/tech_stack}

{/projects}

---

## CERTIFICATIONS

{#certifications}
• **{name}** - {issuer} ({date})
{/certifications}

---

## LANGUAGES

{#languages}
• {language} - {proficiency}
{/languages}

---

_Document generated on {generatedDate}_

---

## Instructions for Creating the Word Template:

1. Create a new Word document
2. Copy the content above (without the markdown formatting)
3. Apply proper Word formatting:
   - Use heading styles for sections
   - Bold the important text manually
   - Set proper fonts and spacing
   - Add any logo or styling you want
4. Save as `cv-template.docx` in the `apps/cv-converter-api/templates/` folder

## Key Points:

- `{placeholderName}` - Single values
- `{#sectionName}...{/sectionName}` - Loops/arrays
- `{#conditionalField}...{/conditionalField}` - Show only if field exists
- `{#.}` - Current item in array
- `{/.}` - End current item

This template will work with both PDF (custom schema) and image (legacy schema) CV data!
