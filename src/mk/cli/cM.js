//npm run new:module module_name crud migration_file_name table_name
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

const createFile = (filePath, content) => {
  fs.writeFileSync(filePath, content, "utf8");
};

const getModelTemplate = (modelName, columns, usesSoftDeletes) => {
  // Verificar si alguna columna es 'client_id'
  let extendsClass = "Model";
  let trait = ";";

  if (columns.includes("client_id")) {
    if (usesSoftDeletes) {
      extendsClass = "ModelMk";
    } else {
      trait = ", ClientTrait;\n"; // Si tiene 'client_id' pero no 'softDeletes', se usa el trait
    }
  }

  return `<?php
namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Factories\\HasFactory;
${
  extendsClass === "Model" && trait != ";"
    ? "use App\\Traits\\ClientTrait;"
    : ""
}
use App\\Models\\${extendsClass};  // Usar Model o ModelMk según corresponda

class ${modelName} extends ${extendsClass}
{
    use HasFactory${trait}
    
    protected \$fillable = [${columns.map((col) => `'${col}'`).join(", ")}];
}
`;
};

const getControllerTemplate = (modelName) => `<?php
namespace App\\Http\\Controllers;

use App\\Models\\${modelName};
use Illuminate\\Http\\Request;

class ${modelName}Controller extends Controller
{
  public function beforeList(Request $request, $model)
  {
    if ($request->fullType == 'L') {
      $model = $model->select($this->getCol($model));
      if (!empty($request->searchBy)) {
        $searchBy = $request->searchBy;
        $model = $model->where('name', 'like', '%' . $searchBy . '%')->orWhere('description', 'like', '%' . $searchBy . '%');
      }
    }

    if ($request->fullType == 'DET') {
      $model = $model->select($this->getCol($model))->where('id', $request->searchBy);
    }

    if ($request->fullType == 'EXTRA') {
      $data = 'extra data';
      return ['data' => ['extra'=>$data]];
    }

    return $model;
  }
}
`;
const appendRouteAndUseToApiFile = (modelName) => {
  let currentDir = __dirname.split("/");
  currentDir = currentDir[currentDir.length - 4];
  const moduleNamePhp = currentDir.split("-")[0];

  const apiFilePath = path.join(
    __dirname,
    "../../../../" + moduleNamePhp + "-api/routes/api.php"
  );
  let apiFileContent = fs.readFileSync(apiFilePath, "utf8");

  // Definir el nombre del controlador en formato PascalCase
  const controllerName = `${modelName}Controller`;
  const fullControllerClass = `App\\Http\\Controllers\\${controllerName}`;

  // Verificar si el 'use' ya existe al inicio del archivo
  if (!apiFileContent.includes(`use ${fullControllerClass};`)) {
    // Buscar la posición del último 'use' para añadir después de él
    const lastUsePosition = apiFileContent.lastIndexOf("use ");
    const nextLinePosition = apiFileContent.indexOf("\n", lastUsePosition);

    // Añadir el nuevo 'use' justo después del último 'use'
    apiFileContent =
      apiFileContent.slice(0, nextLinePosition + 1) +
      `use ${fullControllerClass};\n` +
      apiFileContent.slice(nextLinePosition + 1);
  } else {
    console.log(
      chalk.yellow(`${controllerName} ya tiene un 'use' en el archivo api.php.`)
    );
  }

  // Buscar la sección de Route::apiResources
  const apiResourceSectionStart = apiFileContent.indexOf(
    "Route::apiResources(["
  );

  if (apiResourceSectionStart === -1) {
    console.log(
      chalk.red(
        "No se encontró la sección Route::apiResources en el archivo api.php."
      )
    );
    return;
  }

  // Encontrar el final de la sección Route::apiResources
  const apiResourceSectionEnd = apiFileContent.indexOf(
    "]);",
    apiResourceSectionStart
  );

  if (apiResourceSectionEnd === -1) {
    console.log(
      chalk.red("No se encontró el cierre de la sección Route::apiResources.")
    );
    return;
  }

  // Obtener la sección actual de apiResources
  const apiResourceSection = apiFileContent.slice(
    apiResourceSectionStart,
    apiResourceSectionEnd
  );

  // Verificar si la ruta ya existe
  if (apiResourceSection.includes(`${controllerName}::class`)) {
    console.log(
      chalk.yellow(`${controllerName} ya está presente en el archivo api.php.`)
    );
    return;
  }

  // Crear la nueva entrada para la ruta
  const newRouteEntry = `\n    '${modelName.toLowerCase()}s' => ${controllerName}::class,\n`;

  // Insertar la nueva ruta justo después de "Route::apiResources(["
  const updatedApiResourceSection =
    apiFileContent.slice(0, apiResourceSectionStart + 21) +
    newRouteEntry +
    apiFileContent.slice(apiResourceSectionStart + 21);

  // Actualizar el contenido del archivo api.php
  fs.writeFileSync(apiFilePath, updatedApiResourceSection, "utf8");
  console.log(
    chalk.green(
      `Ruta y 'use' para ${modelName} añadidos al archivo api.php exitosamente.`
    )
  );
};

const createLaravelModelAndController = (
  migrationFileName,
  tableName,
  modelName
) => {
  let currentDir = __dirname.split("/");
  currentDir = currentDir[currentDir.length - 4];
  const moduleNamePhp = currentDir.split("-")[0];

  const migrationsDir = path.join(
    __dirname,
    "../../../../" + moduleNamePhp + "-api/database/migrations"
  );
  // Verificar que el archivo de migración exista
  migrationFileName = migrationFileName + ".php";
  const migrationFile = path.join(migrationsDir, migrationFileName);
  if (!fs.existsSync(migrationFile)) {
    console.log(chalk.red(`Migration file ${migrationFileName} not found.`));
    return;
  }

  // Parsear el archivo de migración para obtener las columnas

  const r = parseMigrationFileForColumns(migrationFile, tableName);
  const columns = r[0];
  if (columns.length === 0) {
    console.log(
      chalk.red(
        `No columns found for table ${tableName} in migration file ${migrationFileName}.`
      )
    );
    return;
  }

  // Crear el modelo
  const modelPath = path.join(
    __dirname,
    "../../../../" + moduleNamePhp + "-api/app/Models",
    `${modelName}.php`
  );

  createFile(modelPath, getModelTemplate(modelName, columns, r[1]));

  // Crear el controlador
  const controllerPath = path.join(
    __dirname,
    "../../../../" + moduleNamePhp + "-api/app/Http/Controllers",
    `${modelName}Controller.php`
  );

  createFile(controllerPath, getControllerTemplate(modelName));

  // Añadir la ruta a api.php
  appendRouteAndUseToApiFile(modelName);

  console.log(
    chalk.green(
      `Model, controller, and route for ${modelName} created successfully.`
    )
  );
};

// Función para parsear el archivo de migración y obtener las columnas de la tabla
const parseMigrationFileForColumns = (migrationFile, tableName) => {
  // Expresión regular para encontrar la definición de la tabla en el archivo de migración
  const migrationContent = fs.readFileSync(migrationFile, "utf8");
  const tableDefinitionMatch = migrationContent.match(
    new RegExp(
      `Schema::create\\(['"\`]${tableName}['"\`],\\s*function\\s*\\(.*?\\)\\s*{(.*?)\\}`,
      "s"
    )
  );

  if (!tableDefinitionMatch) {
    console.log(chalk.red(`Table ${tableName} not found in migration file.`));
    return [];
  }

  const columnsDefinition = tableDefinitionMatch[1];

  // Obtener las columnas desde la definición
  const columnMatches = [
    ...columnsDefinition.matchAll(/table->(\w+)\(['"\`]([\w_]+)['"\`]/g),
  ];
  const columns = columnMatches.map((match) => match[2]);

  return [columns, columnsDefinition.includes("softDeletes")];
};

const parsePHPFile = (filePath) => {
  const phpContent = fs.readFileSync(filePath, "utf8");
  const fillableMatch = phpContent.match(/\$fillable\s*=\s*\[(.*?)\];/s);
  if (!fillableMatch) {
    console.log(chalk.red("No $fillable variable found in the PHP model....."));
    return [];
  }
  const fillableFields = fillableMatch[1]
    .split(",")
    .map((field) => field.trim().replace(/['"\s]/g, ""))
    .filter(Boolean);
  return fillableFields;
};

const parseApiFieldsFile = (filePath, moduleName) => {
  const apiFieldsContent = fs.readFileSync(filePath, "utf8");
  const fillableVarName = `${moduleName.toLowerCase()}_fillable`;
  const fillableMatch = apiFieldsContent.match(
    new RegExp(`${fillableVarName}\\s*=\\s*\\[(.*?)\\];`, "s")
  );
  if (!fillableMatch) {
    console.log(
      chalk.red(`No ${fillableVarName} variable found in api_fields.txt.`)
    );
    return [];
  }
  const fillableFields = fillableMatch[1]
    .split(",")
    .map((field) => field.trim().replace(/['"\s]/g, ""))
    .filter(Boolean);
  return fillableFields;
};

const getCrudTemplate = (
  moduleName,
  fields
) => `/* eslint-disable react-hooks/exhaustive-deps */
import styles from "./${moduleName}.module.css";
import RenderItem from "../shared/RenderItem";
import useCrudUtils from "../shared/useCrudUtils";
import { useEffect, useMemo, useState } from "react";
import ItemList from "@/mk/components/ui/ItemList/ItemList";
import NotAccess from "@/components/layout/NotAccess/NotAccess";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import ImportDataModal from "@/mk/components/data/ImportDataModal/ImportDataModal";


const mod: ModCrudType = {
  modulo: "${moduleName.toLowerCase()}",
  singular: "${moduleName.toLowerCase().slice(0, -1)}",
  plural: "${moduleName.toLowerCase()}",
  permiso: "",
  import: true,
  extraData: true,
};

const paramsInitial = {
  perPage: 100,
  page: 1,
  fullType: "L",
  searchBy: "",
};

const ${moduleName} = () => {
  const fields = useMemo(() => {
    return {
      ${fields
        .map(
          (field) => `
      ${field}: {
        rules: ["required"],
        api: "ae",
        label: "${field.charAt(0).toUpperCase() + field.slice(1)}",
        form: { type: "text" },
        list: true
      },`
        )
        .join("")}
    };
  }, []);

  const onImport = () => {
    setOpenImport(true);
  };

  const {
    userCan,
    List,
    setStore,
    onSearch,
    searchs,
    onEdit,
    onDel,
    showToast,
    execute,
    reLoad,
    getExtraData,
  } = useCrud({
    paramsInitial,
    mod,
    fields,
    _onImport: onImport,
  });
  const { onLongPress, selItem, searchState, setSearchState } = useCrudUtils({
    onSearch,
    searchs,
    setStore,
    mod,
    onEdit,
    onDel,
  });

  const [openImport, setOpenImport] = useState(false);
  useEffect(() => {
    setOpenImport(searchState == 3);
  }, [searchState]);

  const renderItem = (
    item: Record<string, any>,
    i: number,
    onClick: Function
  ) => {
    return (
      <RenderItem item={item} onClick={onClick} onLongPress={onLongPress}>
        <ItemList
          title={item?.name}
          subtitle={item?.description}
          variant="V1"
          active={selItem && selItem.id == item.id}
        />
      </RenderItem>
    );
  };

  if (!userCan(mod.permiso, "R")) return <NotAccess />;
  return (
    <div className={styles.${moduleName.toLowerCase()}}>
      <List onTabletRow={renderItem} />
      {openImport && (
        <ImportDataModal
          open={openImport}
          onClose={() => {
            setSearchState(0);
            setOpenImport(false);
          }}
          mod={mod}
          showToast={showToast}
          reLoad={reLoad}
          execute={execute}
          getExtraData={getExtraData}
          // requiredCols="DEPARTAMENTO, HABITANTES, HABILITADOS, ESCANOS, CODE"
        />
      )}
    </div>
  );
};

export default ${moduleName};
`;

const getMainFileTemplate = (
  moduleName
) => `import styles from './${moduleName}.module.css';

type PropsType = {
  // Add props here

};

const ${moduleName} = ({}:PropsType) => {
  return (
    <div className={styles.${moduleName.toLowerCase()}}>
      <h1>${moduleName} Module</h1>
    </div>
  );
};

export default ${moduleName};
`;

const getStylesFileTemplate = () => `.${moduleName} {
  /* Add your styles here */
}
`;

const getPageFileTemplate = (
  moduleName
) => `import ${moduleName} from '@/modulos/${moduleName}/${moduleName}';

const ${moduleName.toLowerCase()}Page = () => {
  return <${moduleName} />;
};

export default ${moduleName.toLowerCase()}Page;
`;

const createModule = (
  moduleName,
  crud = false,
  modelName = "",
  tableName = "",
  migrationName = ""
) => {
  const moduleDir = path.join(__dirname, "../../modulos", moduleName);
  const pageFilePath = path.join(
    __dirname,
    "../../pages",
    `${moduleName.toLowerCase()}.tsx`
  );

  if (!tableName) {
    console.log(
      chalk.red("Please provide a table name for the Laravel migration.")
    );
  } else {
    console.log(
      chalk.green(
        "Creando modulos para Laravel de la migracion tabla: " + tableName
      )
    );
    createLaravelModelAndController(migrationName, tableName, modelName);
  }

  let currentDir = __dirname.split("/");
  currentDir = currentDir[currentDir.length - 4];
  const moduleNamePhp = currentDir.split("-")[0];

  const apiModelPath = path.join(
    __dirname,
    "../../../../" + moduleNamePhp + "-api/app/models",
    `${modelName}.php`
  );
  // console.log(moduleNamePhp, "**", __dirname);
  const apiFieldsPath = path.join(__dirname, "../../../api_fields.txt");

  if (fs.existsSync(moduleDir)) {
    console.log(chalk.red(`Module ${moduleName} already exists.`));
    return;
  }

  if (fs.existsSync(pageFilePath)) {
    console.log(chalk.red(`Page for module ${moduleName} already exists.`));
    return;
  }

  let fillableFields = [];

  if (fs.existsSync(apiModelPath)) {
    fillableFields = parsePHPFile(apiModelPath);
  } else if (fs.existsSync(apiFieldsPath)) {
    fillableFields = parseApiFieldsFile(apiFieldsPath, moduleName);
  } else {
    console.log(
      chalk.red(
        `API model for ${moduleName} does not exist and api_fields.txt not found.`
      )
    );
    return;
  }

  fs.mkdirSync(moduleDir, { recursive: true });

  const mainFilePath = path.join(moduleDir, `${moduleName}.tsx`);

  if (crud) {
    createFile(mainFilePath, getCrudTemplate(moduleName, fillableFields));
  } else {
    createFile(mainFilePath, getMainFileTemplate(moduleName));
  }

  const stylesFilePath = path.join(moduleDir, moduleName + ".module.css");
  createFile(stylesFilePath, getStylesFileTemplate());

  createFile(pageFilePath, getPageFileTemplate(moduleName));

  console.log(chalk.green(`Module ${moduleName} created successfully.`));
};

let moduleName = process.argv[2] || "";
const crud = process.argv[3] === "crud";
const migrationName = process.argv[4] || "";
const tableName = process.argv[5] || "";

let modelName = (moduleName + ",").split(",")[1] || moduleName.slice(0, -1);
moduleName = moduleName.split(",")[0];

if (!moduleName) {
  console.log(chalk.red("Please provide a module name."));
  process.exit(1);
}

const capitalizedModuleName =
  moduleName.charAt(0).toUpperCase() + moduleName.slice(1);

modelName = modelName.charAt(0).toUpperCase() + modelName.slice(1);
createModule(capitalizedModuleName, crud, modelName, tableName, migrationName);
