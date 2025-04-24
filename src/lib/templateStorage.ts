// In a real app, this would be in a database
let savedTemplate = null;

export function getTemplate() {
  return savedTemplate;
}

export function saveTemplate(template: any) {
  savedTemplate = template;
  return savedTemplate;
}