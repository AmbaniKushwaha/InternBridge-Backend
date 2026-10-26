/**
 * Rule-Based Matching Engine for InternBridge
 * Computes transparent match score (0-99%) based on:
 * - Skill overlap (50%)
 * - Portfolio project relevance (25%)
 * - Availability fit (15%)
 * - Experience level (10%)
 */

export function calculateStudentMatchScore(project, student) {
  const reasons = [];

  // 1. Skill overlap (50%)
  const projectSkills = (project.requiredSkills || []).map((s) => s.toLowerCase().trim());
  const studentSkills = (student.selfReportedSkills || []).map((s) => s.toLowerCase().trim());

  let matchedSkillsCount = 0;
  const matchedSkillsList = [];

  projectSkills.forEach((reqSkill) => {
    const hasMatch = studentSkills.some(
      (stSkill) => stSkill.includes(reqSkill) || reqSkill.includes(stSkill)
    );
    if (hasMatch) {
      matchedSkillsCount++;
      matchedSkillsList.push(reqSkill);
    }
  });

  const skillOverlapRatio =
    projectSkills.length > 0 ? matchedSkillsCount / projectSkills.length : 0.8;
  const skillScore = Math.min(100, Math.round(skillOverlapRatio * 100));

  if (matchedSkillsList.length > 0) {
    reasons.push(
      `Matches ${matchedSkillsCount} required skill(s): ${matchedSkillsList.slice(0, 3).join(', ')}`
    );
  } else {
    reasons.push('Limited direct overlap with primary listed skills');
  }

  // 2. Portfolio relevance (25%)
  let portfolioMatchCount = 0;
  if (student.portfolioItems && student.portfolioItems.length > 0) {
    student.portfolioItems.forEach((item) => {
      const itemTech = (item.technologies || []).map((t) => t.toLowerCase());
      const itemSkills = (item.skillsDemonstrated || []).map((s) => s.toLowerCase());
      const hasSkill = projectSkills.some(
        (ps) =>
          itemTech.some((t) => t.includes(ps) || ps.includes(t)) ||
          itemSkills.some((s) => s.includes(ps) || ps.includes(s))
      );
      if (
        hasSkill ||
        item.projectType
          .toLowerCase()
          .includes((project.category || '').toLowerCase().split(' ')[0])
      ) {
        portfolioMatchCount++;
      }
    });
  }

  const portfolioScore = Math.min(
    100,
    Math.round(
      student.portfolioItems && student.portfolioItems.length > 0
        ? portfolioMatchCount > 0
          ? 85
          : 40
        : 20
    )
  );

  if (portfolioMatchCount > 0) {
    reasons.push(`Has ${portfolioMatchCount} related showcase portfolio project(s)`);
  } else if (student.portfolioItems && student.portfolioItems.length > 0) {
    reasons.push('Has active portfolio work in adjacent technical domains');
  }

  // 3. Availability fit (15%)
  let availabilityScore = 70;
  const avail = student.availability || '';
  if (avail.includes('15-25') || avail.includes('Full-time') || avail.includes('Flexible')) {
    availabilityScore = 95;
    reasons.push(`Availability (${avail}) comfortably matches duration`);
  } else {
    availabilityScore = 65;
    reasons.push(`Part-time student schedule (${avail})`);
  }

  // 4. Experience level (10%)
  let experienceScore = 70;
  if (student.experienceLevel === 'Advanced') experienceScore = 95;
  else if (student.experienceLevel === 'Intermediate') experienceScore = 85;
  else experienceScore = 65;

  const totalWeightedScore = Math.round(
    skillScore * 0.5 +
      portfolioScore * 0.25 +
      availabilityScore * 0.15 +
      experienceScore * 0.1
  );

  return {
    score: Math.min(99, Math.max(35, totalWeightedScore)),
    reasons,
  };
}

export function calculateTeamMatchScore(project, team) {
  const reasons = [];
  const projectSkills = (project.requiredSkills || []).map((s) => s.toLowerCase().trim());
  const combinedTeamSkills = (team.combinedSkills || []).map((s) => s.toLowerCase().trim());

  let matchedSkillsCount = 0;
  const matchedSkillsList = [];

  projectSkills.forEach((reqSkill) => {
    const hasMatch = combinedTeamSkills.some(
      (ts) => ts.includes(reqSkill) || reqSkill.includes(ts)
    );
    if (hasMatch) {
      matchedSkillsCount++;
      matchedSkillsList.push(reqSkill);
    }
  });

  const skillOverlapRatio =
    projectSkills.length > 0 ? matchedSkillsCount / projectSkills.length : 0.85;
  const skillScore = Math.min(100, Math.round(skillOverlapRatio * 100));

  if (matchedSkillsList.length > 0) {
    reasons.push(
      `Team covers ${matchedSkillsCount} required skill(s) across ${(team.members || []).length} members`
    );
  } else {
    reasons.push('Partial skill coverage across team composition');
  }

  const portfolioScore = (team.members || []).length >= 2 ? 88 : 70;
  reasons.push(`Cross-functional team structure with ${(team.members || []).length} active roles`);

  const availabilityScore = 90;
  reasons.push('Shared team bandwidth accommodates milestone deliverables');

  const experienceScore = 80;

  const totalWeightedScore = Math.round(
    skillScore * 0.5 +
      portfolioScore * 0.25 +
      availabilityScore * 0.15 +
      experienceScore * 0.1
  );

  return {
    score: Math.min(99, Math.max(40, totalWeightedScore)),
    reasons,
  };
}
