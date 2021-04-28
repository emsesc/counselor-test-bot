const gql = require('./graphql.js');
const yaml = require('js-yaml');

const parseTable = (markdown) => {
  let labContent = ""
  try {
    labContent = markdown.split('---\n')
    if (labContent[2] == null) {
      labContent = markdown
    } else {
      labContent.splice(0,2);
      labContent = labContent.join('---\n')
      labContent = labContent.toString()
    }
  } catch (e) {
    labContent = markdown
  }

  return labContent
}

const issueNo = async (context) => {
  const payload = context.issue({
    state: "open",
  })

  let res = await context.octokit.issues.listForRepo(payload)
  
  return res.data[0].number
}

const typeStep = async (currentStep, configyml, eventTrigger) => {  
    const step = configyml.steps[currentStep]
    var stepType = step.stepType;
    var event = configyml.steps[currentStep].event

    try {
      var files = step.actions[0].files
      var scripts = step.actions[0].scripts
    } catch (e) {
      var files = "None"
      var scripts = "None"
    }

    if (event != eventTrigger) {
        return null
    }
    return [stepType, files, scripts]
}

const findStep = async (context) => {
  const responseBody = context.issue({
    path: ".bit/.progress"
  });

  let countfile = await context.octokit.repos.getContent(responseBody);
  let count = Buffer.from(countfile.data.content, 'base64').toString()
  return parseInt(count)
}

const yamlFile = async (context) => {
    try {
        var yamlfile = await context.octokit.repos.getContent({
          owner: context.payload.repository.owner.login,
          repo: context.payload.repository.name,
          path:".bit/config.yml",
    });
    } catch (e) {
        return null
    }

    yamlfile = Buffer.from(yamlfile.data.content, 'base64').toString()

    try {
      let fileContents = yamlfile
      configyml = yaml.load(fileContents);
    } catch (e) {
      const issueBody = context.issue({
        title: "[ERROR] Please read",
        body: `There was an issue parsing the config file of this course. Please contact your counselor and send them the below error.\n${e}`,
      });

      context.octokit.issues.create(issueBody)
      console.log("ERROR: " + e);
      return null
    }

    return configyml;
}

const getFileContent = async (context, content) => {
    const responseBody = context.issue({
        path: content,
      });
    file = await context.octokit.repos.getContent(responseBody);
    body = Buffer.from(file.data.content, 'base64').toString()
    return [file, body];
}

exports.yamlFile = yamlFile
exports.getFileContent = getFileContent
exports.findStep = findStep
exports.typeStep = typeStep
exports.issueNo = issueNo
exports.parseTable = parseTable