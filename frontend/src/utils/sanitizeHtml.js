/**
 * Simple HTML sanitizer that strips out potentially dangerous tags
 * while keeping safe formatting tags
 */
export const sanitizeHtml = (html) => {
  if (!html) return ''
  
  // Create a temporary div to parse HTML
  const temp = document.createElement('div')
  temp.innerHTML = html
  
  // Remove script tags and other dangerous elements
  const dangerous = temp.querySelectorAll('script, iframe, object, embed, link')
  dangerous.forEach(el => el.remove())
  
  return temp.innerHTML
}

/**
 * Strip all HTML tags and return plain text
 */
export const stripHtml = (html) => {
  if (!html) return ''
  
  const temp = document.createElement('div')
  temp.innerHTML = html
  return temp.textContent || temp.innerText || ''
}

