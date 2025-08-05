interface FileTemplate {
    name: string;
}

interface KnitTemplates {
    Controller: FileTemplate;
    Service: FileTemplate;
}

interface FileTemplates {
    ModuleScript: FileTemplate;
    Client: FileTemplate;
    Server: FileTemplate;
    Knit: KnitTemplates;
}

const fileTemplates: FileTemplates = {
    ModuleScript: {
        name: 'ModuleScript'
    },
    Client: {
        name: 'LocalScript'
    },
    Server: {
        name: 'Script'
    },
    Knit: {
        Controller: {
            name: 'Controller'
        },
        Service: {
            name: 'Service'
        }
    }
};

export {fileTemplates,FileTemplate};
