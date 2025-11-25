# Portfolio Template

This is a portfolio website template that can be easily customized and shared.

## Quick Start

1. **Fork or clone this repository**

2. **Customize your personal information** in `user/profile.ts`:
   ```typescript
   export const userProfile: UserProfile = {
     name: 'Your Name',
     title: 'Your Title',
     github: 'https://github.com/yourusername',
     // ... etc
   };
   ```

3. **Add your projects** in `user/projects.ts`:
   ```typescript
   export const userProjects: Project[] = [
     {
       data: {
         id: 'project-1',
         title: 'My Project',
         description: 'Description here',
         tags: ['React', 'TypeScript'],
         featured: true,
       },
       builder: new BaseProjectBuilder(),
     },
   ];
   ```

4. **Run the development server**:
   ```bash
   npm install
   npm start
   ```

## What's Customizable

### User-Specific Data (`user/` directory)
- ✅ Personal profile information
- ✅ Portfolio projects
- ✅ Custom project builders (optional)

### Generic Code (shared across all portfolios)
- ✅ UI components and layouts
- ✅ Theme system
- ✅ Routing and navigation
- ✅ Base project builders
- ✅ Type definitions

## Sharing Your Portfolio

The `user/` directory contains all your personal data. You can:
- Keep it in the repository (public portfolio)
- Add `user/` to `.gitignore` (private data)
- Share the generic code while keeping your data separate

## License

This template is designed to be shared and customized. Feel free to:
- Use it for your own portfolio
- Share it with others
- Modify the generic code to suit your needs
- Create your own custom project builders



