/**
 * Your Portfolio Projects
 * 
 * Add your actual projects here. Each project consists of:
 * 1. Data (JSON structure) - all the project information
 * 2. Builder - a class that implements IProjectBuilder to render the project
 * 
 * You can use BaseProjectBuilder for standard projects, or create
 * custom builders for projects that need unique styling/layout.
 * 
 * For software projects, you can use SoftwareProjectData which includes
 * languages, frameworks, and categorized tags.
 */

import { Project, ProjectReason, ProjectType, ProjectTag } from '@/projects/types';
import { BaseProjectBuilder } from '@/projects';
import { SoftwareProjectData, Language, Framework } from '@/projects/extensions/software';
import { AppProjectData, AppProjectBuilder } from '@/projects/extensions/software/extensions/app';
import { SoftwarePackageProjectData, PackageProjectBuilder } from '@/projects/extensions/software/extensions/package';
// Import any custom builders you create:
// See docs/examples/ for examples of custom builders

/**
 * Your portfolio projects.
 * 
 * Example structure for a basic project:
 * {
 *   data: {
 *     id: 'unique-project-id',
 *     title: 'Project Title',
 *     description: 'Project description',
 *     imageUrl: 'https://example.com/image.png',
 *     githubUrl: 'https://github.com/username/project',
 *     liveUrl: 'https://project-demo.com',
 *     tags: ['React', 'TypeScript', 'Node.js'],
 *     featured: true,
 *     startDate: '2024-01-15',
 *     endDate: '2024-03-20',
 *     hoursWorked: 120,
 *     contributors: 1,
 *     reason: ProjectReason.Personal,
 *     projectType: ProjectType.Personal,
 *     rating: 8,
 *   },
 *   builder: new BaseProjectBuilder(),
 * },
 * 
 * Example structure for a software project (with languages, frameworks):
 * {
 *   data: {
 *     id: 'software-project',
 *     title: 'My Software Project',
 *     description: 'A software project description',
 *     languages: [Language.TypeScript, Language.Python],
 *     frameworks: [Framework.React, Framework.FastAPI],
 *     categorizedTags: [ProjectTag.WebApp, ProjectTag.OpenSource],
 *     tags: ['Custom Tag'],
 *     startDate: '2024-01-15',
 *     endDate: '2024-06-01',
 *     hoursWorked: 320,
 *     contributors: 3,
 *     reason: ProjectReason.Work,
 *     projectType: ProjectType.Work,
 *     rating: 9,
 *     status: 'active',
 *     license: 'MIT',
 *   } as SoftwareProjectData,
 *   builder: new BaseProjectBuilder(),
 * },
 */
export const userProjects: Project[] = [
  // Add your projects here
  // Example basic project:
  // {
  //   data: {
  //     id: 'pyprez',
  //     title: 'PyPrez',
  //     description: 'Run Python in the browser using pyodide => web assembly.',
  //     githubUrl: 'https://github.com/modularizer/pyprez',
  //     liveUrl: 'https://example.com',
  //     tags: ['Python', 'WebAssembly', 'Pyodide'],
  //     featured: true,
  //     startDate: '2023-06-01',
  //     endDate: '2023-08-15',
  //     hoursWorked: 80,
  //     contributors: 1,
  //     reason: ProjectReason.Personal,
  //     projectType: ProjectType.Personal,
  //     rating: 8,
  //   },
  //   builder: new BaseProjectBuilder(),
  // },
  
  // Example software project:
  // {
  //   data: {
  //     id: 'my-app',
  //     title: 'My Awesome App',
  //     description: 'A full-stack web application',
  //     languages: [Language.TypeScript, Language.Python],
  //     frameworks: [Framework.React, Framework.FastAPI],
  //     categorizedTags: [ProjectTag.WebApp, ProjectTag.OpenSource],
  //     tags: ['Full Stack', 'Modern'],
  //     githubUrl: 'https://github.com/username/my-app',
  //     liveUrl: 'https://my-app.com',
  //     startDate: '2024-01-15',
  //     endDate: '2024-05-20',
  //     hoursWorked: 320,
  //     contributors: 2,
  //     reason: ProjectReason.Work,
  //     projectType: ProjectType.Work,
  //     rating: 9,
  //     status: 'active',
  //     license: 'MIT',
  //   } as SoftwareProjectData,
  //   builder: new BaseProjectBuilder(),
  // },
];

