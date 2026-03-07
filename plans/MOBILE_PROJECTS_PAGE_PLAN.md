# Mobile Projects Page Implementation Plan

## Overview
Create a Projects page for the mobile app (React Native/Expo) that matches the functionality of the existing web Projects page.

## Current Frontend Projects Page Features
Based on analysis of `frontend/src/pages/Projects.jsx`:

### Features:
1. **Project Listing** - Display all projects with:
   - Category filtering (All, Website, Game, App, Other)
   - Search functionality
   - Project cards showing: name, description, category icon, link, tags

2. **Create Project Dialog** - Form to create new project with:
   - Name (required)
   - Description (optional)
   - Link (required - URL)
   - Category selection (website, game, app, other)
   - Tags (comma-separated)

3. **View Project** - Click on project to open link in new tab

4. **Categories:**
   - All Projects
   - Websites (Globe icon)
   - Games (Gamepad icon)
   - Apps (Smartphone icon)
   - Other (Folder icon)

## Mobile Implementation Plan

### 1. Create ProjectsScreen Component
**File:** `mobile/src/screens/projects/ProjectsScreen.js`

Structure:
- Header with title "Projects" and search bar
- Category filter chips (horizontal scroll)
- FlatList of project cards
- FAB (Floating Action Button) for creating new project
- Modal for create project form

### 2. Project Card Component
**File:** `mobile/src/components/projects/ProjectCard.js`

Design:
- Card with rounded corners
- Category icon on left
- Project name (bold)
- Description (truncated to 2 lines)
- Link preview
- Tags as chips

### 3. Create Project Modal
**File:** Inline in ProjectsScreen or separate component

Form fields:
- Name (TextInput)
- Description (TextInput multiline)
- Link (TextInput with URL validation)
- Category (Picker/Selector)
- Tags (TextInput)

### 4. Navigation Integration
**File:** `mobile/src/navigation/AppNavigator.js`

Add to:
- HomeStack or ProfileStack
- Route: `Projects` -> `ProjectsScreen`

### 5. Add Translations
**Files:** 
- `mobile/src/i18n/en.js`
- `mobile/src/i18n/id.js`

Keys to add:
- `projects` - "Projects" / "Proyek"
- `createProject` - "Create Project" / "Buat Proyek"
- `projectName` - "Project Name" / "Nama Proyek"
- `projectDescription` - "Description" / "Deskripsi"
- `projectLink` - "Link" / "Tautan"
- `projectCategory` - "Category" / "Kategori"
- `projectTags` - "Tags" / "Tag"
- `allProjects` - "All Projects" / "Semua Proyek"
- `websites` - "Websites" / "Situs Web"
- `games` - "Games" / "Permainan"
- `apps` - "Apps" / "Aplikasi"
- `other` - "Other" / "Lainnya"

### 6. API Integration
Use existing API endpoints (already exists in backend):
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- No auth required for viewing (based on frontend implementation)

## Technical Notes

### Dependencies:
- Uses existing `api` client from `mobile/src/api/`
- Uses existing `useThemeStore` for dark/light mode
- Uses existing `useLanguageStore` for i18n

### UI Components to Reuse:
- `TouchableOpacity` for interactive elements
- `TextInput` for forms
- `Modal` for create project dialog
- `FlatList` for project listing
- `Ionicons` for icons
- `ActivityIndicator` for loading states
- `Alert` for error messages

### Category Icons Mapping:
- website -> `globe-outline`
- game -> `game-controller-outline`
- app -> `phone-portrait-outline`
- other -> `folder-outline`

## File Structure
```
mobile/src/
├── screens/
│   └── projects/
│       └── ProjectsScreen.js    # Main Projects screen
├── components/
│   └── projects/
│       └── ProjectCard.js       # Project card component
└── i18n/
    ├── en.js                   # Add project translations
    └── id.js                   # Add project translations
```

## Implementation Order
1. Add translations to i18n files
2. Create ProjectCard component
3. Create ProjectsScreen with listing
4. Add create project modal
5. Integrate with navigation
6. Test and verify
