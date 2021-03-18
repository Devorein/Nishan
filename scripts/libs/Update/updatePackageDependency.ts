import fs from 'fs';
import { NishanScripts } from '../';
import { IPackageDependencyVersionMap } from '../types';

export async function updatePackageDependency (packages_deps_version_map: IPackageDependencyVersionMap, package_name: string) {
  const {package_json_data, package_json_path} = await NishanScripts.Get.packageJsonData(package_name);
  const package_version = packages_deps_version_map.get(package_name)!,
    package_deps_version_info = package_version?.get(package_name);
  if(package_deps_version_info)
    package_json_data.version = package_deps_version_info[1];

  [ 'dependencies', 'devDependencies' ].forEach((dependency_type) => {
    Object.entries(package_json_data[dependency_type]).forEach(([dependency_name])=>{
      const dependency_version_info = package_version.get(dependency_name)!;
      package_json_data[dependency_type][dependency_name] = dependency_version_info[0];
    });
  });
  console.log();

  await fs.promises.writeFile(package_json_path, JSON.stringify(package_json_data, null, 2), 'utf-8');
}
