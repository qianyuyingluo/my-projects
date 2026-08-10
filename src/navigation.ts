export const HOME_RETURN_SECTION_KEY = "portfolio:return-section";

export const rememberHomeSection = (sectionId: string) => {
  try {
    window.sessionStorage.setItem(HOME_RETURN_SECTION_KEY, sectionId);
  } catch {
    // Storage can be unavailable in privacy-restricted browsing contexts.
  }
};

export const consumeHomeSection = () => {
  try {
    const sectionId = window.sessionStorage.getItem(HOME_RETURN_SECTION_KEY);
    window.sessionStorage.removeItem(HOME_RETURN_SECTION_KEY);
    return sectionId;
  } catch {
    return null;
  }
};
