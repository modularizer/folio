# User Configuration

This directory contains all user-specific data that needs to be customized for your portfolio.

## Files

### `profile.ts`
Contains your personal information:
- Name
- Title/Bio
- Contact information
- Social media links (GitHub, LinkedIn, Twitter, etc.)

**To customize:** Edit the `userProfile` object with your information.

### `projects.ts`
Contains all your portfolio projects.

**To customize:** 
1. Add your projects to the `userProjects` array
2. Each project needs:
   - `data`: JSON object with project information (id, title, description, tags, etc.)
   - `builder`: A builder class instance (use `BaseProjectBuilder()` for standard projects)

## Example Project

```typescript
{
  data: {
    id: 'my-project',
    title: 'My Awesome Project',
    description: 'A description of what this project does',
    imageUrl: 'https://example.com/screenshot.png',
    githubUrl: 'https://github.com/username/project',
    liveUrl: 'https://project-demo.com',
    tags: ['React', 'TypeScript', 'Node.js'],
    featured: true,
  },
  builder: new BaseProjectBuilder(),
}
```

## Custom Builders

If you want a project to have unique styling or layout, you can create a custom builder:

1. Create a new file in `projects/your-project/YourProjectBuilder.tsx`
2. Extend `BaseProjectBuilder` or implement `IProjectBuilder`
3. Override `buildPreviewCard()` and/or `buildDetailPage()` methods
4. Import and use it in `projects.ts`

See `projects/example/ExampleProject.tsx` for a reference implementation.



