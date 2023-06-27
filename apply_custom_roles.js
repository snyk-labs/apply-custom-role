const fs = require('fs');
const commander = require('commander');
const SnykApiUtils = require('./snyk_api_utils');
const SnykRolesService = require('./snyk_roles_service');

const main = async () => {
  // parse opts
  commander
    .version('1.0.0', '-v, --version')
    .usage('-t <api token> -g <group id> -f <file of emails>')
    .requiredOption('-t, --token <api token>', 'API Token')
    .requiredOption('-g, --group-id <group id>', 'Group Id')
    .requiredOption('-r --custom-role <public role id>', 'Public Role Id')
    .requiredOption('-f --file <file of emails>', 'Email List')
    .parse(process.argv);
  const options = commander.opts();

  // read file of email addresses - 1 per line
  const emails = fs
    .readFileSync(options.file, {
      encoding: 'utf8',
      flag: 'r',
    })
    .trim()
    .split('\n');

  console.log(`Read in ${emails.length} email addresses`);

  const snykApiUtils = new SnykApiUtils(options.token);
  const snykRolesService = new SnykRolesService(snykApiUtils);

  const orgs = await snykApiUtils.orgsForGroup(options.groupId);
  for (const org of orgs) {
    await snykRolesService.applyRoleForEmails(org, emails, options.customRole);
  }
};

// set up for async calls
(async function () {
  await main();
})();
