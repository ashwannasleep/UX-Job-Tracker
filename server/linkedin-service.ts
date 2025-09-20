import { LinkedInJob, LinkedInProfile, LINKEDIN_JOB_URL_REGEX, LINKEDIN_PROFILE_URL_REGEX } from "@shared/linkedin-types";

export class LinkedInService {
  /**
   * Extract job ID from LinkedIn job URL
   */
  static extractJobId(url: string): string | null {
    const match = url.match(LINKEDIN_JOB_URL_REGEX);
    return match ? match[1] : null;
  }

  /**
   * Extract profile username from LinkedIn profile URL
   */
  static extractProfileUsername(url: string): string | null {
    const match = url.match(LINKEDIN_PROFILE_URL_REGEX);
    return match ? match[1] : null;
  }

  /**
   * Parse LinkedIn job URL and extract what we can from the URL structure
   * Note: This is a basic implementation. In production, you'd want to use
   * LinkedIn's API or a web scraping service (with proper permissions)
   */
  static async parseJobUrl(jobUrl: string): Promise<Partial<LinkedInJob> | null> {
    try {
      const jobId = this.extractJobId(jobUrl);
      if (!jobId) {
        throw new Error("Invalid LinkedIn job URL");
      }

      // For demo purposes, we'll extract what we can from the URL
      // In production, you'd make API calls to LinkedIn or use a scraping service
      
      return {
        jobUrl,
        // These would be populated from actual API calls
        title: "",
        company: "",
        location: "",
        description: "",
      };
    } catch (error) {
      console.error("Error parsing LinkedIn job URL:", error);
      return null;
    }
  }

  /**
   * Parse job data from pasted text (user can copy/paste from LinkedIn)
   * This is a more practical approach than API scraping
   */
  static parseJobFromText(text: string, jobUrl?: string): Partial<LinkedInJob> {
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    
    let title = "";
    let company = "";
    let location = "";
    let description = "";
    let employmentType = "";

    // Look for common patterns in LinkedIn job postings
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const nextLine = lines[i + 1] || "";
      
      // Job title is usually the first substantial line - be more flexible
      if (!title && line.length > 2 && !line.includes('@') && !line.includes('·') && 
          !line.toLowerCase().includes('linkedin') && !line.includes('http')) {
        title = line;
        console.log(`Parsed title: "${title}"`);
        continue;
      }
      
      // Company name often follows the title
      if (title && !company && line.length > 1 && 
          !line.toLowerCase().includes('linkedin') && !line.includes('http')) {
        company = line.replace(/^at\s+/i, '').replace(/\s+·.*$/, '').replace(/\s*\|.*$/, '');
        console.log(`Parsed company: "${company}"`);
        continue;
      }
      
      // Location patterns - be more flexible
      if (line.includes(',') || line.toLowerCase().includes('remote') || 
          line.match(/\b(CA|NY|TX|FL|WA|IL|PA|OH|NC|GA|VA|MI|IN|TN|MO|MD|WI|MN|CO|AL|SC|LA|KY|OR|OK|CT|AR|MS|KS|UT|NV|NM|WV|NE|ID|HI|AK|DE|MT|ND|SD|VT|NH|RI|WY|DC)\b/) ||
          line.match(/\b(United States|USA|Canada|Remote|New York|San Francisco|Los Angeles|Chicago|Boston|Seattle|Austin|Denver|Miami|Atlanta|Dallas|Houston|Phoenix|Philadelphia|San Diego|Portland|Nashville)\b/i)) {
        location = line;
        console.log(`Parsed location: "${location}"`);
        continue;
      }
      
      // Employment type
      if (line.match(/full.time|part.time|contract|freelance|internship|temporary|permanent/i)) {
        employmentType = line;
        console.log(`Parsed employment type: "${employmentType}"`);
        continue;
      }
    }

    // If we didn't find title and company in the first few lines, try different strategies
    if (!title && lines.length > 0) {
      // Sometimes the title is the very first non-empty line
      title = lines[0];
      console.log(`Fallback title: "${title}"`);
    }
    
    if (!company && lines.length > 1) {
      // Try the second line as company
      const secondLine = lines[1];
      if (secondLine && !secondLine.toLowerCase().includes('linkedin') && !secondLine.includes('http')) {
        company = secondLine.replace(/^at\s+/i, '').replace(/\s+·.*$/, '').replace(/\s*\|.*$/, '');
        console.log(`Fallback company: "${company}"`);
      }
    }

    // Use description as remaining text
    const descriptionStart = Math.min(3, Math.max(2, lines.findIndex(line => 
      line.length > 50 || line.toLowerCase().includes('description') || 
      line.toLowerCase().includes('we are') || line.toLowerCase().includes('seeking')
    )));
    const descriptionLines = lines.slice(descriptionStart);
    description = descriptionLines.join('\n').substring(0, 500);

    console.log(`Final parsed data: title="${title}", company="${company}", location="${location}"`);

    return {
      title: title || "",
      company: company || "", 
      location: location || "",
      description,
      jobUrl: jobUrl || "",
      employmentType,
    };
  }

  /**
   * Parse CSV data for bulk import
   */
  static parseCsvData(csvText: string): Array<Partial<LinkedInJob>> {
    const lines = csvText.split('\n').map(line => line.trim()).filter(Boolean);
    
    if (lines.length < 2) {
      throw new Error("CSV must have at least a header row and one data row");
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const jobs: Array<Partial<LinkedInJob>> = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const job: Partial<LinkedInJob> = {};

      headers.forEach((header, index) => {
        const value = values[index] || "";
        
        switch (header) {
          case 'title':
          case 'position':
          case 'job title':
            job.title = value;
            break;
          case 'company':
          case 'company name':
            job.company = value;
            break;
          case 'location':
            job.location = value;
            break;
          case 'url':
          case 'job url':
          case 'link':
            job.jobUrl = value;
            break;
          case 'description':
            job.description = value;
            break;
          case 'employment type':
          case 'type':
            job.employmentType = value;
            break;
        }
      });

      if (job.title && job.company) {
        jobs.push(job);
      }
    }

    return jobs;
  }

  /**
   * Generate application suggestions based on profile and job
   */
  static generateApplicationSuggestions(profile: LinkedInProfile, job: LinkedInJob): {
    notes: string;
    matchScore: number;
    suggestedSalary?: number;
  } {
    let matchScore = 0;
    let notes = "";
    
    // Check for skill matches
    if (profile.skills && job.description) {
      const matchingSkills = profile.skills.filter(skill => 
        job.description!.toLowerCase().includes(skill.toLowerCase())
      );
      
      if (matchingSkills.length > 0) {
        matchScore += matchingSkills.length * 10;
        notes += `Matching skills: ${matchingSkills.join(', ')}. `;
      }
    }

    // Check experience relevance
    if (profile.experience && job.title) {
      const relevantExperience = profile.experience.filter(exp =>
        exp.title.toLowerCase().includes(job.title!.toLowerCase()) ||
        job.title!.toLowerCase().includes(exp.title.toLowerCase())
      );
      
      if (relevantExperience.length > 0) {
        matchScore += 20;
        notes += `Relevant experience: ${relevantExperience[0].title} at ${relevantExperience[0].company}. `;
      }
    }

    // Normalize match score to percentage
    matchScore = Math.min(matchScore, 100);
    
    if (notes === "") {
      notes = "Consider highlighting relevant experience and skills when applying.";
    }

    return {
      notes: notes.trim(),
      matchScore,
      suggestedSalary: matchScore > 50 ? undefined : undefined, // Could implement salary suggestions
    };
  }
}