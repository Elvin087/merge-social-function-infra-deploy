// QUICK script to help me deploy the social merge function to acc. NOT RDY to be used in prod.

const util = require("util");
const fs = require("fs");
const exec = util.promisify(require("child_process").exec);

const opcos = [
  "nl-pearle",
  "be-pearle",
  "be-grandoptical",
  "es-masvision",
  "es-optica2000",
  "fr-grandoptical",
  "it-grandvision",
  "ie-visionexpress",
  "gb-visionexpress",
  "it-grandvision",
  "nl-eyewish",
  "be-pearle",
  "pt-grandoptical",
  "pt-multiopticas",
  "fr-generaleoptique",
];

const env = "acceptance";
const cfgPath = "/Users/elvin/Grandvision/ENV/ALL/cfg";
const envPath = "/Users/elvin/Grandvision/ENV/ALL/env";

const execute = async (command, options = {}) => {
  try {
    const { stdout, stderr } = await exec(command, options);
    console.log("stdout:", stdout);
    console.log("stderr:", stderr);
  } catch (error) {
    if (
      error.stderr.startsWith(
        "fatal: a branch named 'feat/social-merge-func-acceptance' already exists"
      )
    ) {
      console.log("Branch already exists");
      return;
    }

    if (error.stderr.includes("already exists and is not an empty directory")) {
      return;
    }
    console.log("--Error ->", error);
  }
};

const handleEnvProjects = async (authSharedSecret = undefined) => {
  for (item of opcos) {
    const envName = `env-${item}`;
    const currentPath = `${envPath}/${envName}`;
    const terraformFunctionFile = `${envPath}/${envName}/${env}/functions.tf`;
    const kustomizationFile = `${envPath}/${envName}/${env}/kustomization.yaml`;

    console.log(`Cloning ${currentPath}`);
    await execute(`git clone git@github.com:GrandVisionHQ/${envName}`, {
      cwd: `${envPath}`,
    });

    console.log(`Checking out branch for ${envName}`);
    await execute(`git checkout -b feat/social-merge-func-${env}`, {
      cwd: `${currentPath}`,
    });

    // add function
    const functionFileContent = fs
      .readFileSync(terraformFunctionFile)
      .toString();

    // update functions terraform file
    if (
      !functionFileContent.match(/customer-alternate-login-merge-functions/g)
    ) {
      const data = functionFileContent.split("\n");

      data.push(`module "customer-alternate-login-merge-functions" {
  source = "git@github.com:GrandVisionHQ/deploy-manifests.git//modules/customer-alternate-login-merge-functions?ref=v1.42.0-rc.0"

  opco        = var.opco
  environment = var.environment

  azure_location                           = var.azure_location
  azure_resource_group_name                = var.azure_resource_group_name
  azure_web_jobs_storage_connection_string = data.azurerm_storage_account.gvfunctions.primary_connection_string
  azure_servicebus_connection_string       = module.opco.servicebus_keda_connection_string
}`);

      console.log("Write functions.tf", terraformFunctionFile);
      fs.writeFileSync(terraformFunctionFile, data.join("\n"));
    } else {
      console.log("functions.tf already updated", envName);
    }

    let kustomizationFileContent = fs
      .readFileSync(kustomizationFile)
      .toString();

    // update kustomization.yaml images
    if (
      !kustomizationFileContent.match(
        /customer-alternate-login-merge-functions/g
      )
    ) {
      let content = insertToFile(
        kustomizationFileContent,
        "grandvision.azurecr.io/customer-service",
        [
          "  - name: grandvision.azurecr.io/customer-alternate-login-merge-functions",
          "    newTag: v1.0.0-rc.0",
        ]
      );

      console.log("Kustomization.yaml part 1 done");
      fs.writeFileSync(kustomizationFile, content);

      kustomizationFileContent = fs.readFileSync(kustomizationFile).toString();

      // update kustomization.yaml bases
      content = insertToFile(
        kustomizationFileContent,
        "deploy-manifests.git//modules/customer-service?",
        [
          "  - git@github.com:GrandVisionHQ/deploy-manifests.git//modules/customer-alternate-login-merge-functions?ref=v1.42.0-rc.0",
        ]
      );

      console.log("Kustomization.yaml part 2 done");
      fs.writeFileSync(kustomizationFile, content);
    } else {
      console.log("Kustomization.yaml already updated", envName);
    }
  }
};

const listCfgRepos = () => {
  for (item of opcos) {
    console.log(`cfg-${item}-${env}`);
    // console.log(`https://github.com/GrandVisionHQ/cfg-${item}-${env}`);
  }
};

const updateCfg = async () => {
  for (item of opcos) {
    const cfgName = `cfg-${item}-${env}`;
    // console.log(`https://github.com/GrandVisionHQ/cfg-${item}-${env}`);
    execute(`pwd`, { cwd: cfgPath });
    // execute(`pwd`);
  }
};

const createPR = async (isCfg) => {
  for (item of opcos) {
    const cfgName = isCfg ? `cfg-${item}-${env}` : `env-${item}`;
    const currentPath = isCfg
      ? `${cfgPath}/${cfgName}`
      : `${envPath}/${cfgName}`;

    console.log("-ja-->", currentPath);
    // await execute(`git add customer-alternate-login-merge-functions.env.sec`, {
    //   cwd: `${currentPath}`,
    // });

    // await execute(`git commit -am "feat: add social merge functions"`, {
    //   cwd: `${currentPath}`,
    // });

    // await execute(
    //   `git push --set-upstream origin feat/social-merge-func-${env}`,
    //   {
    //     cwd: `${currentPath}`,
    //   }
    // );
    // feat: add social merge function

    await execute(`hub pull-request -m "feat: add social merge function"`, {
      cwd: `${currentPath}`,
    });
  }
};

const pushBranchCfg = async (isCfg) => {
  for (item of opcos) {
    const cfgName = isCfg ? `cfg-${item}-${env}` : `env-${item}`;
    const currentPath = isCfg
      ? `${cfgPath}/${cfgName}`
      : `${envPath}/${cfgName}`;

    // await execute(`git add customer-alternate-login-merge-functions.env.sec`, {
    //   cwd: `${currentPath}`,
    // });

    // await execute(`git commit -am "feat: add social merge functions"`, {
    //   cwd: `${currentPath}`,
    // });

    // await execute(
    //   `git push --set-upstream origin feat/social-merge-func-${env}`,
    //   {
    //     cwd: `${currentPath}`,
    //   }
    // );

    // await execute(`hub pull-request -m "feat: add social merge function"`, {
    //   cwd: `${currentPath}`,
    // });

    // You will bve rae limited
    setTimeout(async () => {
      await execute(
        `git add customer-alternate-login-merge-functions.env.sec`,
        {
          cwd: `${currentPath}`,
        }
      );

      await execute(`git commit -am "feat: linting"`, {
        cwd: `${currentPath}`,
      });
      await execute(`git push`, {
        cwd: `${currentPath}`,
      });

      // await execute(
      //   `git push --set-upstream origin feat/social-merge-func-${env}`,
      //   {
      //     cwd: `${currentPath}`,
      //   }
      // );

      // await execute(`hub pull-request -m "feat: add social merge function"`, {
      //   cwd: `${currentPath}`,
      // });
    }, 1000);
  }
};

const pushBranchEnv = async () => {
  for (item of opcos) {
    const name = `env-${item}`;
    const currentPath = `${envPath}/${name}`;

    console.log("-ja-->", currentPath);
    // await execute(`git add customer-alternate-login-merge-functions.env.sec`, {
    //   cwd: `${currentPath}`,
    // });

    // await execute(`git commit -am "feat: add social merge functions"`, {
    //   cwd: `${currentPath}`,
    // });

    // await execute(
    //   `git push --set-upstream origin feat/social-merge-func-${env}`,
    //   {
    //     cwd: `${currentPath}`,
    //   }
    // );

    // await execute(`hub pull-request -m "feat: add social merge function"`, {
    //   cwd: `${currentPath}`,
    // });

    // You will bve rae limited
    setTimeout(async () => {
      await execute(
        `git branch --set-upstream-to=origin/feat/social-merge-func-acceptance feat/social-merge-func-acceptance`,
        {
          cwd: `${currentPath}`,
        }
      );

      await execute(`git config pull.rebase false`, {
        cwd: `${currentPath}`,
      });

      await execute(`git pull`, {
        cwd: `${currentPath}`,
      });

      await execute(`git push`, {
        cwd: `${currentPath}`,
      });
      // await execute(`git commit -am "feat: add merge function"`, {
      //   cwd: `${currentPath}`,
      // });

      // await execute(`git config --add --bool push.autoSetupRemote true`, {
      //   cwd: `${currentPath}`,
      // });
      // await execute(`git push`, {
      //   cwd: `${currentPath}`,
      // });
    }, 1000);
  }
};

const updateAllRepos = async (isCfg = false) => {
  for (item of opcos) {
    const cfgName = isCfg ? `cfg-${item}-${env}` : `env-${item}`;
    const currentPath = isCfg
      ? `${cfgPath}/${cfgName}`
      : `${envPath}/${cfgName}`;

    await execute(`git config pull.rebase false`, {
      cwd: `${currentPath}`,
    });

    await execute(`git pull origin master`, {
      cwd: `${currentPath}`,
    });
  }
};

const handleCfgProjects = async (authSharedSecret = undefined) => {
  for (item of opcos) {
    const cfgName = `cfg-${item}-${env}`;
    // if (cfgName === "cfg-fr-generaleoptique-acceptance") {
    console.log("--->", `git clone git@github.com:GrandVisionHQ/${cfgName}`);
    const currentPath = `${cfgPath}/${cfgName}`;

    if (!fs.existsSync(currentPath)) {
      console.log(`Cloning ${currentPath}`);
      await execute(`git clone git@github.com:GrandVisionHQ/${cfgName}`, {
        cwd: `${cfgPath}`,
      });

      console.log(`Checking out branch for ${cfgName}`);
      await execute(`git checkout -b feat/social-merge-func-${env}`, {
        cwd: `${currentPath}`,
      });

      console.log(`Checking out branch for ${cfgName}`);
      await execute(`git-crypt unlock`, {
        cwd: `${currentPath}`,
      });
    } else {
      console.log("Init project already done");
    }

    const secretConfigFile = `${cfgPath}/${cfgName}/customer-alternate-login-merge-functions.env.sec`;
    // create secrets file
    if (!fs.existsSync(secretConfigFile)) {
      console.log("Writing CFG secret file");

      // TODO edit secret for prod
      await fs.writeFileSync(
        secretConfigFile,
        `
SERVICEBUS_ALTERNATE_ACCOUNT_MERGE_QUEUE=customers_alternate-login-merge-functions-queue
API_GRAPHQL_GATEWAY=https://${item}-${env}-api.grandvision.io/graphql
AUTH_SHARED_SECRET_CUSTOMER_SERVICE=${
          authSharedSecret
            ? authSharedSecret
            : `${item}-Generate_a_random_secret_for_this_in_production._Must_be_shared_between_customer_service_and_callers`
        }`
      );
    } else {
      console.log("CFG secret file already available");
    }

    // update config.yaml
    const configYamlFilePath = `${cfgPath}/${cfgName}/config.yaml`;
    const configFileContent = fs.readFileSync(configYamlFilePath).toString();

    // update config.yml
    if (!configFileContent.match(/customer-alternate-login-merge-functions/g)) {
      const data = configFileContent.split("\n");
      let toInsertFileLineIndex = null;
      data.forEach((fileLine, index) => {
        if (fileLine.includes("alias: customer-service")) {
          toInsertFileLineIndex = index;
        }
      });

      const toInsert = [
        "    - alias: customer-alternate-login-merge-functions",
        "      git: git@github.com:GrandVisionHQ/customer-alternate-login-merge-functions.git",
        "      tag: v*.*.*-rc.*", // TODO edit for prod
      ];
      toInsert
        .reverse()
        .forEach((item) => data.splice(toInsertFileLineIndex, 0, item));

      console.log("Write config.yaml", cfgName);
      fs.writeFileSync(configYamlFilePath, data.join("\n"));
    } else {
      console.log("config.yaml already updated", cfgName);
    }
  }
};

const insertToFile = (configFileContent, matchContition, toInsertList) => {
  const data = configFileContent.split("\n");
  let toInsertFileLineIndex = null;
  data.forEach((fileLine, index) => {
    if (fileLine.includes(matchContition)) {
      toInsertFileLineIndex = index;
    }
  });

  // const toInsert = [
  //   "    - alias: customer-alternate-login-merge-functions",
  //   "      git: git@github.com:GrandVisionHQ/customer-alternate-login-merge-functions.git",
  //   "      tag: v*.*.*-rc.*", // TODO edit for prod
  // ];
  toInsertList
    .reverse()
    .forEach((item) => data.splice(toInsertFileLineIndex, 0, item));

  return data.join("\n");
};

const prs = async () => {
  // const rs = [
  //   "https://github.com/GrandVisionHQ/env-nl-pearle/pull/5714",
  //   "https://github.com/GrandVisionHQ/env-be-grandoptical/pull/5426",
  //   "https://github.com/GrandVisionHQ/env-es-masvision/pull/3645",
  //   "https://github.com/GrandVisionHQ/env-es-optica2000/pull/5124",
  //   "https://github.com/GrandVisionHQ/env-fr-grandoptical/pull/4457",
  //   "https://github.com/GrandVisionHQ/env-it-grandvision/pull/5949",
  //   "https://github.com/GrandVisionHQ/env-ie-visionexpress/pull/6453",
  //   "https://github.com/GrandVisionHQ/env-gb-visionexpress/pull/6267",
  //   "https://github.com/GrandVisionHQ/env-it-grandvision/pull/5949",
  //   "https://github.com/GrandVisionHQ/env-nl-eyewish/pull/5358",
  //   "https://github.com/GrandVisionHQ/env-pt-grandoptical/pull/2103",
  //   "https://github.com/GrandVisionHQ/env-pt-multiopticas/pull/5834",
  //   "https://github.com/GrandVisionHQ/env-fr-generaleoptique/pull/4425",
  // ];

  // old
  // const rs = [
  //   "https://github.com/GrandVisionHQ/cfg-nl-pearle-acceptance/pull/184",
  //   "https://github.com/GrandVisionHQ/cfg-be-grandoptical-acceptance/pull/158",
  //   "https://github.com/GrandVisionHQ/cfg-es-masvision-acceptance/pull/181",
  //   "https://github.com/GrandVisionHQ/cfg-es-optica2000-acceptance/pull/184",
  //   "https://github.com/GrandVisionHQ/cfg-fr-grandoptical-acceptance/pull/226",
  //   "https://github.com/GrandVisionHQ/cfg-it-grandvision-acceptance/pull/204",
  //   "https://github.com/GrandVisionHQ/cfg-ie-visionexpress-acceptance/pull/230",
  //   "https://github.com/GrandVisionHQ/cfg-gb-visionexpress-acceptance/pull/238",
  //   "https://github.com/GrandVisionHQ/cfg-pt-grandoptical-acceptance/pull/77",
  //   "https://github.com/GrandVisionHQ/cfg-fr-generaleoptique-acceptance/pull/227",
  //   "https://github.com/GrandVisionHQ/cfg-pt-multiopticas-acceptance/pull/226",
  //   "https://github.com/GrandVisionHQ/cfg-be-pearle-acceptance/pull/190",
  //   "https://github.com/GrandVisionHQ/cfg-nl-eyewish-acceptance/pull/144",
  // ]; // feat: add social merge function
  const rs = [
    "https://github.com/GrandVisionHQ/cfg-nl-pearle-acceptance/pull/186",
    "https://github.com/GrandVisionHQ/cfg-be-grandoptical-acceptance/pull/161",
    "https://github.com/GrandVisionHQ/cfg-es-masvision-acceptance/pull/186",
    "https://github.com/GrandVisionHQ/cfg-es-optica2000-acceptance/pull/187",
    "https://github.com/GrandVisionHQ/cfg-fr-grandoptical-acceptance/pull/229",
    "https://github.com/GrandVisionHQ/cfg-it-grandvision-acceptance/pull/206",
    "https://github.com/GrandVisionHQ/cfg-ie-visionexpress-acceptance/pull/233",
    "https://github.com/GrandVisionHQ/cfg-gb-visionexpress-acceptance/pull/242",
    "https://github.com/GrandVisionHQ/cfg-pt-grandoptical-acceptance/pull/79",
    "https://github.com/GrandVisionHQ/cfg-fr-generaleoptique-acceptance/pull/230",
    "https://github.com/GrandVisionHQ/cfg-pt-multiopticas-acceptance/pull/228",
    "https://github.com/GrandVisionHQ/cfg-pt-multiopticas-acceptance/pull/228",
    "https://github.com/GrandVisionHQ/cfg-nl-eyewish-acceptance/pull/146",
  ];

  for (item of rs) {
    console.log(item);
    // await execute(`open ${item}`, {
    //   cwd: `${envPath}`,
    // });
  }
};

(async () => {
  try {
    // await handleEnvProjects();
    // await handleCfgProjects();
    // await pushBranch(false);
    // await updateAllEnvRepos(false);
    // await pushBranchEnv();
    // await handleEnvProjects();
    // await pushBranchEnv();
    // await createPR(true);
    await prs();
    // await updateAllRepos(true);
  } catch (error) {
    console.log("--->", error);
  }
})();
