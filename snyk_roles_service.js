class SnykRolesService {
  constructor(snykApiUtils) {
    this.snykApiUtils = snykApiUtils;
  }

  applyRoleForEmails = async (org, emails, roleId) => {
    console.log(`Working on org: ${org.slug}`);
    const members = await this.snykApiUtils.membersInOrg(org.id);
    for (const member of members) {
      const email = emails.find(
        (email) => email.toLowerCase() === member.email
      );
      if (email) {
        await this.snykApiUtils.applyCustomRole({
          orgId: org.id,
          orgSlug: org.slug,
          userId: member.id,
          roleId: roleId,
          email: email,
        });
      }
    }
  };
}

module.exports = SnykRolesService;
