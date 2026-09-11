describe('Debug', () => {
  it('dump html', () => {
    cy.visit('/admin/dashboard', {
      onBeforeLoad(win) {
        win.localStorage.setItem('bypassAuth', 'true');
      }
    });
    cy.document().then((doc) => {
      cy.task('log', doc.body.innerHTML);
    });
  });
});
