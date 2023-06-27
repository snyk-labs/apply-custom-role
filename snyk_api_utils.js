const axios = require('axios');
const axiosRetry = require('axios-retry');

const apiBase = 'https://api.snyk.io/v1';

class SnykApiUtils {
  constructor(token) {
    this.client = axios.create({
      baseURL: apiBase,
      headers: {
        Authorization: `token ${token}`,
      },
    });
    // automatically retry axios calls 3 times
    axiosRetry(this.client, { retries: 3 });
  }

  // recursively grab all orgs in a given group
  // returns an array of orgs
  // [
  //     {
  //         "name": "myDefaultOrg",
  //         "id": "689ce7f9-7943-4a71-b704-2ba575f01089",
  //         "slug": "my-default-org",
  //         "url": "https://api.snyk.io/org/default-org",
  //         "created": "2021-06-07T00:00:00.000Z"
  //     },
  //     ...
  // ]
  orgsForGroup = async (groupId, pageNum = 1, previousResponse = []) => {
    return this.client
      .get(`${apiBase}/group/${groupId}/orgs?page=${pageNum}`)
      .then((newResponse) => {
        const response = [...previousResponse, ...newResponse.data.orgs];
        if (newResponse.data.orgs.length !== 0) {
          console.log(
            `read ${newResponse.data.orgs.length} orgs on page ${pageNum} ` +
              `for group ${groupId}`
          );
          return this.orgsForGroup(groupId, ++pageNum, response);
        }
        return response;
      });
  };

  // grab all members of a given org
  // [
  //   {
  //     id: '',
  //     name: '',
  //     username: '',
  //     email: '',
  //     role: '',
  //   },
  //   ...
  // ];
  membersInOrg = async (orgId) => {
    const members = await this.client.get(
      `${apiBase}/org/${orgId}/members?includeGroupAdmins=true`
    );
    // lowercase emails
    return members.data.map((member) => {
      return {
        id: member.id,
        name: member.name,
        username: member.username,
        email: member.email?.toLowerCase(),
        role: member.role,
      };
    });
  };

  applyCustomRole = async (options) => {
    const res = await this.client.put(
      `${apiBase}/org/${options.orgId}/members/update/${options.userId}`,
      {
        rolePublicId: options.roleId,
      }
    );
    if (res.status === 200) {
      console.log(
        `\tapplied role for: ${options.email} in org: ${options.orgSlug}`
      );
    } else {
      console.log(
        `\terror applying role for: ${options.email}; status: ${res.status}`
      );
    }
  };

  processOrg = async (org, emails, roleId) => {
    console.log(`Working on org: ${org.slug}`);
    const members = await this.membersInOrg(org.id);
    for (const member of members) {
      const email = emails.find(
        (email) => email.toLowerCase() === member.email
      );
      if (email) {
        await this.applyCustomRole({
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

module.exports = SnykApiUtils;
