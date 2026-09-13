-- CreateIndex
CREATE INDEX "assessments_sectionId_idx" ON "assessments"("sectionId");

-- CreateIndex
CREATE INDEX "assessments_teacherId_idx" ON "assessments"("teacherId");

-- CreateIndex
CREATE INDEX "complaints_campusId_idx" ON "complaints"("campusId");

-- CreateIndex
CREATE INDEX "complaints_studentId_idx" ON "complaints"("studentId");

-- CreateIndex
CREATE INDEX "invoices_studentId_idx" ON "invoices"("studentId");

-- CreateIndex
CREATE INDEX "invoices_campusId_idx" ON "invoices"("campusId");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "leaves_teacherId_idx" ON "leaves"("teacherId");

-- CreateIndex
CREATE INDEX "payment_allocations_invoiceId_idx" ON "payment_allocations"("invoiceId");

-- CreateIndex
CREATE INDEX "payment_allocations_paymentId_idx" ON "payment_allocations"("paymentId");

-- CreateIndex
CREATE INDEX "payments_studentId_idx" ON "payments"("studentId");

-- CreateIndex
CREATE INDEX "results_sectionId_idx" ON "results"("sectionId");

-- CreateIndex
CREATE INDEX "sections_campusId_idx" ON "sections"("campusId");

-- CreateIndex
CREATE INDEX "teacher_assignments_sectionId_idx" ON "teacher_assignments"("sectionId");

-- CreateIndex
CREATE INDEX "user_roles_campusId_idx" ON "user_roles"("campusId");
