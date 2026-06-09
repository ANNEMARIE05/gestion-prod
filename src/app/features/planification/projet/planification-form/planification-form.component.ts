import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ProductionType } from '../../../../models/production';
import { ProductionService } from '../../../production/services/production.service';
import { SettingsService } from '../../../settings/services/settings.service';
import { PlanificationService } from '../../services/planification.service';
import { PlanTask, PlanTaskInput, PlanTaskStatus } from '../../../../models/plan-task';
import { ButtonLoadingDirective } from '../../../../shared/directives/button-loading.directive';

@Component({
  selector: 'app-planification-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ButtonLoadingDirective,
  ],
  templateUrl: './planification-form.component.html',
  styleUrl: './planification-form.component.scss'
})
export class PlanificationFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly settings = inject(SettingsService);
  private readonly productionService = inject(ProductionService);
  planningType = input<ProductionType>('PROJECT');
  close = output<void>();
  initialTask = input<PlanTask | null>(null);
  saveTask = output<PlanTaskInput>();
  loading = input(false);

  /** Libellés de statut : projet / monitoring = NOK, En cours, Terminé ; veille = À faire, etc. */
  readonly statusOptions = computed(() => {
    const pt = this.planningType();
    if (pt === 'PROJECT' || pt === 'MONITORING') {
      return [
        { value: 'TODO' as PlanTaskStatus, label: 'NOK' },
        { value: 'IN_PROGRESS' as PlanTaskStatus, label: 'En cours' },
        { value: 'DONE' as PlanTaskStatus, label: 'Terminé' },
      ];
    }
    return [
      { value: 'TODO' as PlanTaskStatus, label: 'À faire' },
      { value: 'IN_PROGRESS' as PlanTaskStatus, label: 'En cours' },
      { value: 'DONE' as PlanTaskStatus, label: 'Terminé' },
    ];
  });
  readonly equipmentTypeOptions = [
    { value: 'PC', label: 'PC' },
    { value: 'SERVEUR', label: 'Serveur' },
    { value: 'VM', label: 'VM' },
  ];
  readonly locationTypeOptions = [
    { value: 'CLOUD', label: 'Cloud' },
    { value: 'SITE', label: 'Site' },
    { value: 'BUREAU', label: 'Bureau' },
  ];
  readonly equipmentStateOptions = [
    { value: 'FONCTIONNEL', label: 'Fonctionnel' },
    { value: 'DEFAILLANT', label: 'Defaillant' },
    { value: 'HORS_SERVICE', label: 'Hors service' },
  ];
  readonly licenseStatusOptions = [
    { value: 'OUI', label: 'Oui' },
    { value: 'NON', label: 'Non' },
    { value: 'A_RENOUVELER', label: 'A renouveler' },
  ];
  readonly topicOptions = [
    { value: 'IA', label: 'IA' },
    { value: 'CYBERSECURITE', label: 'Cybersécurité' },
    { value: 'CLOUD', label: 'Cloud' },
    { value: 'DATA', label: 'Data' },
    { value: 'DEVOPS', label: 'DevOps' },
    { value: 'AUTRE', label: 'Autre' },
  ];
  readonly sourceOptions = [
    { value: 'CONFERENCE', label: 'Conférence' },
    { value: 'ARTICLE', label: 'Article' },
    { value: 'PROJET_INTERNE', label: 'Projet interne' },
    { value: 'FORMATION', label: 'Formation' },
    { value: 'AUTRE', label: 'Autre' },
  ];
  readonly maturityLevelOptions = [
    { value: 'VEILLE', label: 'Veille' },
    { value: 'ETUDE', label: 'Étude' },
    { value: 'POC', label: 'PoC' },
    { value: 'DEVELOPPEMENT', label: 'Développement' },
  ];
  readonly impactOptions = [
    { value: 'ELEVE', label: 'Élevé' },
    { value: 'MOYEN', label: 'Moyen' },
    { value: 'FAIBLE', label: 'Faible' },
  ];

  form = this.fb.group({
    productionType: this.fb.control<ProductionType>('PROJECT', { nonNullable: true, validators: [Validators.required] }),
    productionTypeLabel: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
    projectId: this.fb.control('', { nonNullable: true }),
    entityId: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
    ownerId: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
    startDate: this.fb.control<Date | null>(null, Validators.required),
    expectedEndDate: this.fb.control<Date | null>(null, Validators.required),
    progress: this.fb.control<number>(0, [Validators.required, Validators.min(0), Validators.max(100)]),
    jalonId: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
    subJalonId: this.fb.control('', { nonNullable: true }),
    subJalonApplicationId: this.fb.control('', { nonNullable: true }),
    identification: this.fb.control('', { nonNullable: true }),
    topic: this.fb.control('', { nonNullable: true }),
    source: this.fb.control('', { nonNullable: true }),
    watchId: this.fb.control('', { nonNullable: true }),
    opportunity: this.fb.control('', { nonNullable: true }),
    maturityLevel: this.fb.control('', { nonNullable: true }),
    potentialImpact: this.fb.control('', { nonNullable: true }),
    actionTaken: this.fb.control('', { nonNullable: true }),
    equipmentId: this.fb.control('', { nonNullable: true }),
    auditId: this.fb.control('', { nonNullable: true }),
    specialtyId: this.fb.control('', { nonNullable: true }),
    equipmentType: this.fb.control('', { nonNullable: true }),
    locationType: this.fb.control('', { nonNullable: true }),
    equipmentIdentifier: this.fb.control('', { nonNullable: true }),
    assignedResourceId: this.fb.control('', { nonNullable: true }),
    commissioningDate: this.fb.control<Date | null>(null),
    equipmentState: this.fb.control('', { nonNullable: true }),
    lastMaintenanceDate: this.fb.control<Date | null>(null),
    nextMaintenanceDate: this.fb.control<Date | null>(null),
    warrantyDeadline: this.fb.control<Date | null>(null),
    licenseStatus: this.fb.control('', { nonNullable: true }),
    auditRemarks: this.fb.control('', { nonNullable: true }),
    issues: this.fb.control('', { nonNullable: true }),
    correctiveActions: this.fb.control('', { nonNullable: true }),
    status: this.fb.control<PlanTaskStatus>('TODO', { nonNullable: true, validators: [Validators.required] }),
    actualEndDate: this.fb.control<Date | null>(null),
    comments: this.fb.control('', { nonNullable: true }),
  });

  private readonly selectedProductionType = signal<ProductionType>('PROJECT');
  private readonly selectedJalonId = signal('');
  private readonly selectedSubJalonId = signal('');

  readonly projects = computed(() =>
    this.productionService
      .allProductionItems()
      .filter((item) => item.type === this.selectedProductionType()),
  );

  readonly watchOptions = computed(() =>
    this.productionService
      .allProductionItems()
      .filter((item) => item.type === 'ENGINEERING')
      .sort((a, b) => a.libelle.localeCompare(b.libelle)),
  );

  readonly auditProductionOptions = computed(() =>
    this.productionService
      .allProductionItems()
      .filter((item) => item.type === 'AUDIT')
      .sort((a, b) => a.libelle.localeCompare(b.libelle)),
  );

  readonly entityOptions = computed(() =>
    this.settings.entitySelectOptions().filter((opt) => opt.active),
  );

  /** Liste des utilisateurs du paramétrage (écran Utilisateurs). */
  readonly ownerOptions = computed(() => this.settings.usersForSelect());
  readonly specialtyOptions = computed(() =>
    this.settings.allSpecialties().filter((s) => s.active).sort((a, b) => a.label.localeCompare(b.label)),
  );
  readonly isAuditType = computed(() =>
    this.planningType() === 'AUDIT' ||
    this.selectedProductionType() === 'AUDIT' ||
    this.form.controls.productionType.value === 'AUDIT',
  );
  readonly isWatchType = computed(() =>
    this.planningType() === 'ENGINEERING' ||
    this.selectedProductionType() === 'ENGINEERING' ||
    this.form.controls.productionType.value === 'ENGINEERING',
  );
  /** Formulaire « veille / ingénierie » (champs découverte, veille, maturité…). */
  readonly isEngineeringPlanningType = computed(() => this.isWatchType());
  /** Planification d’audit informatique sur équipement (fiche technique + audit de production). */
  readonly isAuditPlanningType = computed(() => this.isAuditType());
  /** Projets et monitoring : jalons projet classiques. */
  readonly isProjectOrMonitoringPlanningType = computed(
    () => !this.isEngineeringPlanningType() && !this.isAuditPlanningType(),
  );
  /** Champ Application réservé à la planification projet (pas monitoring). */
  readonly isProjectPlanningType = computed(() => this.planningType() === 'PROJECT');

  readonly jalonOptions = computed(() =>
    this.settings
      .allJalons()
      .filter((j) => !j.parentId)
      .sort((a, b) => a.label.localeCompare(b.label, 'fr')),
  );

  readonly subJalonOptions = computed(() => {
    const parentId = this.selectedJalonId();
    if (!parentId) {
      return [];
    }
    return this.settings
      .allJalons()
      .filter((j) => j.parentId === parentId)
      .sort((a, b) => a.label.localeCompare(b.label, 'fr'));
  });

  readonly subJalonApplicationOptions = computed(() => {
    // Niveau sélectionné : sous-jalon si présent, sinon jalon clé (parent),
    // comme dans l'ancien projet (applications du jalon parent ou du sous-jalon).
    const targetJalonId = this.selectedSubJalonId() || this.selectedJalonId();
    if (!targetJalonId) {
      return [];
    }
    const jalon = this.settings.getJalonById(targetJalonId);
    const ids = jalon?.applicationIds ?? [];
    return this.settings
      .allApplications()
      .filter((app) => app.active && ids.includes(app.id))
      .sort((a, b) => a.label.localeCompare(b.label));
  });

  readonly showApplicationSelect = computed(
    () => this.subJalonApplicationOptions().length > 0,
  );

  /** Le sous-jalon est obligatoire dès qu'un jalon sélectionné possède des sous-jalons. */
  readonly isSubJalonRequired = computed(
    () => this.subJalonOptions().length > 0 && !this.isEngineeringPlanningType(),
  );

  constructor() {
    effect(() => {
      const currentType = this.planningType();
      this.selectedProductionType.set(currentType);
      this.form.controls.productionType.setValue(currentType, { emitEvent: false });
      if (!this.initialTask()) {
        this.form.controls.productionTypeLabel.setValue(this.defaultTypeLabel(currentType), { emitEvent: false });
      }
      this.applyTypeValidators(currentType);
      if (currentType === 'AUDIT' && !this.initialTask()) {
        const startCtrl = this.form.controls.startDate;
        const endCtrl = this.form.controls.expectedEndDate;
        if (startCtrl.value == null && endCtrl.value == null) {
          const s = new Date();
          const e = new Date(s);
          e.setDate(e.getDate() + 30);
          this.form.patchValue(
            {
              startDate: s,
              expectedEndDate: e,
              progress: 0,
              status: 'TODO',
              entityId: this.entityOptions()[0]?.id ?? '',
              ownerId: this.ownerOptions()[0]?.id ?? '',
            },
            { emitEvent: false },
          );
        }
      }
      if (
        (currentType === 'PROJECT' || currentType === 'MONITORING') &&
        !this.initialTask()
      ) {
        const specs = this.specialtyOptions();
        const sid = this.form.controls.specialtyId.value;
        if (specs.length && !sid) {
          this.form.patchValue({ specialtyId: specs[0]!.id }, { emitEvent: false });
        }
        const roots = this.jalonOptions();
        const jid = this.form.controls.jalonId.value;
        if (roots.length && !String(jid ?? '').trim()) {
          const first = roots[0]!;
          this.form.patchValue({ jalonId: first.id }, { emitEvent: false });
          this.selectedJalonId.set(first.id);
        }
        if (currentType === 'MONITORING') {
          this.form.controls.subJalonApplicationId.setValue('', { emitEvent: false });
        }
      }
    });

    effect(() => {
      const ctrl = this.form.controls.subJalonId;
      if (this.isSubJalonRequired()) {
        ctrl.setValidators([Validators.required]);
      } else {
        ctrl.clearValidators();
      }
      ctrl.updateValueAndValidity({ emitEvent: false });
    });

    this.form.controls.jalonId.valueChanges.subscribe((value) => {
      this.selectedJalonId.set(value ?? '');
      this.form.controls.subJalonId.setValue('');
      this.form.controls.subJalonApplicationId.setValue('');
      this.selectedSubJalonId.set('');
    });

    this.form.controls.subJalonId.valueChanges.subscribe((value) => {
      this.selectedSubJalonId.set(value ?? '');
      this.form.controls.subJalonApplicationId.setValue('');
    });

    this.form.controls.productionType.valueChanges.subscribe((value) => {
      this.selectedProductionType.set(value ?? 'PROJECT');
      this.form.controls.projectId.setValue('');
      this.form.controls.auditId.setValue('');
      this.applyTypeValidators(value ?? 'PROJECT');
    });
    this.applyTypeValidators(this.planningType());
  }

  ngOnInit(): void {
    const initial = this.initialTask();
    if (!initial) {
      return;
    }
    const initialJalon = initial.jalonId ? this.settings.getJalonById(initial.jalonId) : undefined;
    const derivedParentId = initial.subJalonId
      ? initial.jalonId ?? ''
      : initialJalon?.parentId
        ? initialJalon.parentId
        : initial.jalonId ?? '';
    const derivedSubJalonId = initial.subJalonId ?? (initialJalon?.parentId ? initialJalon.id : '');

    this.selectedProductionType.set(initial.type);
    this.applyTypeValidators(initial.type);
    this.selectedJalonId.set(derivedParentId);
    this.selectedSubJalonId.set(derivedSubJalonId);
    this.form.patchValue({
      productionType: initial.type,
      projectId: initial.projectId,
      productionTypeLabel: initial.productionTypeLabel,
      entityId: initial.entityId,
      ownerId: initial.ownerId,
      startDate: initial.startDate,
      expectedEndDate: initial.expectedEndDate,
      progress: initial.progress,
      jalonId: derivedParentId,
      subJalonId: derivedSubJalonId,
      subJalonApplicationId: initial.applicationId ?? '',
      identification: initial.identification ?? '',
      topic: initial.topic ?? '',
      source: initial.source ?? '',
      watchId: initial.watchId ?? initial.projectId,
      opportunity: initial.opportunity ?? '',
      maturityLevel: initial.maturityLevel ?? '',
      potentialImpact: initial.potentialImpact ?? '',
      actionTaken: initial.actionTaken ?? '',
      equipmentId: initial.equipmentId ?? '',
      auditId: initial.auditId ?? initial.projectId,
      specialtyId: initial.specialtyId ?? '',
      equipmentType: initial.equipmentType ?? '',
      locationType: initial.locationType ?? '',
      equipmentIdentifier: initial.equipmentIdentifier ?? '',
      assignedResourceId: initial.assignedResourceId ?? '',
      commissioningDate: initial.commissioningDate ?? null,
      equipmentState: initial.equipmentState ?? '',
      lastMaintenanceDate: initial.lastMaintenanceDate ?? null,
      nextMaintenanceDate: initial.nextMaintenanceDate ?? null,
      warrantyDeadline: initial.warrantyDeadline ?? null,
      licenseStatus: initial.licenseStatus ?? '',
      auditRemarks: initial.auditRemarks ?? '',
      issues: initial.issues ?? '',
      correctiveActions: initial.correctiveActions ?? '',
      status: initial.status,
      actualEndDate: initial.actualEndDate ?? null,
      comments: initial.comments ?? '',
    });
    if (
      (initial.type === 'PROJECT' || initial.type === 'MONITORING') &&
      !String(this.form.controls.specialtyId.value || '').trim()
    ) {
      const first = this.specialtyOptions()[0];
      if (first) {
        this.form.patchValue({ specialtyId: first.id }, { emitEvent: false });
      }
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const isAudit = raw.productionType === 'AUDIT';
    const isProjectOrMonitoring =
      raw.productionType === 'PROJECT' || raw.productionType === 'MONITORING';

    let entityId = raw.entityId;
    let ownerId = raw.ownerId;
    let startDate = raw.startDate;
    let expectedEndDate = raw.expectedEndDate;
    let progress = raw.progress ?? 0;
    let status = raw.status;
    let actualEndDate = raw.actualEndDate;

    if (isProjectOrMonitoring) {
      entityId = '';
    }

    if (isAudit) {
      entityId = entityId || this.entityOptions()[0]?.id || '';
      ownerId = ownerId || this.ownerOptions()[0]?.id || '';
      const s = startDate ?? new Date();
      let end = expectedEndDate;
      if (!end) {
        end = new Date(s);
        end.setDate(end.getDate() + 30);
      }
      startDate = s;
      expectedEndDate = end;
    }

    const project = this.projects().find((item) => item.id === raw.projectId);
    const audit = this.auditProductionOptions().find((item) => item.id === raw.auditId);
    const watch = this.watchOptions().find((item) => item.id === raw.watchId);
    const entity = this.entityOptions().find((item) => item.id === entityId);
    const specialty = this.specialtyOptions().find((item) => item.id === raw.specialtyId);
    const jalon = this.jalonOptions().find((item) => item.id === raw.jalonId);
    const subJalon = this.subJalonOptions().find((item) => item.id === raw.subJalonId);
    const appFromSub = this.subJalonApplicationOptions().find((item) => item.id === raw.subJalonApplicationId);
    const isMonitoringPlan = raw.productionType === 'MONITORING';
    this.saveTask.emit({
      type: raw.productionType,
      productionTypeLabel: raw.productionTypeLabel,
      projectId:
        raw.productionType === 'ENGINEERING'
          ? (raw.watchId || raw.projectId)
          : raw.productionType === 'AUDIT'
            ? (raw.auditId || raw.projectId)
            : raw.projectId,
      projectLabel:
        raw.productionType === 'ENGINEERING'
          ? (watch?.libelle ?? raw.watchId ?? raw.projectId)
          : raw.productionType === 'AUDIT'
            ? (audit?.libelle ?? raw.auditId ?? raw.projectId)
            : (project?.libelle ?? raw.projectId),
      entityId,
      entityLabel: isProjectOrMonitoring ? '' : (entity?.label ?? entityId),
      ownerId,
      startDate: startDate as Date,
      expectedEndDate: expectedEndDate as Date,
      actualEndDate,
      progress,
      jalonId: raw.jalonId || undefined,
      jalonLabel: jalon?.label,
      subJalonId: raw.subJalonId || undefined,
      subJalonLabel: subJalon?.label,
      applicationId: isMonitoringPlan ? undefined : raw.subJalonApplicationId || '0',
      applicationLabel: isMonitoringPlan ? undefined : appFromSub?.label,
      identification: raw.identification || undefined,
      topic: (raw.topic || undefined) as PlanTask['topic'],
      source: (raw.source || undefined) as PlanTask['source'],
      watchId: raw.watchId || undefined,
      watchLabel: watch?.libelle,
      discoveryDate: raw.startDate,
      opportunity: raw.opportunity || undefined,
      maturityLevel: (raw.maturityLevel || undefined) as PlanTask['maturityLevel'],
      potentialImpact: (raw.potentialImpact || undefined) as PlanTask['potentialImpact'],
      actionTaken: raw.actionTaken || undefined,
      equipmentId: raw.equipmentId || undefined,
      auditId: raw.auditId || undefined,
      specialtyId: raw.specialtyId || undefined,
      specialtyLabel: specialty?.label,
      equipmentType: (raw.equipmentType || undefined) as PlanTask['equipmentType'],
      locationType: (raw.locationType || undefined) as PlanTask['locationType'],
      equipmentIdentifier: raw.equipmentIdentifier || undefined,
      assignedResourceId: raw.assignedResourceId || undefined,
      assignedTo: undefined,
      commissioningDate: raw.commissioningDate,
      equipmentState: (raw.equipmentState || undefined) as PlanTask['equipmentState'],
      lastMaintenanceDate: raw.lastMaintenanceDate,
      nextMaintenanceDate: raw.nextMaintenanceDate,
      warrantyDeadline: raw.warrantyDeadline,
      licenseStatus: (raw.licenseStatus || undefined) as PlanTask['licenseStatus'],
      auditRemarks: raw.auditRemarks || undefined,
      issues: isAudit ? '' : raw.issues,
      correctiveActions: isAudit ? '' : raw.correctiveActions,
      comments: isAudit ? '' : raw.comments,
      status,
    });
  }

  cancel(): void {
    this.close.emit();
  }

  private defaultTypeLabel(type: ProductionType): string {
    if (type === 'AUDIT') return 'Audit IT';
    if (type === 'ENGINEERING') return 'Veille / Ingenierie';
    if (type === 'MONITORING') return 'Monitoring';
    return 'Projet';
  }

  private applyTypeValidators(type: ProductionType): void {
    if (type === 'ENGINEERING') {
      this.form.controls.entityId.clearValidators();
      this.form.controls.auditId.clearValidators();
      this.form.controls.watchId.setValidators([Validators.required]);
      this.form.controls.identification.setValidators([Validators.required]);
      this.form.controls.topic.setValidators([Validators.required]);
      this.form.controls.source.setValidators([Validators.required]);
      this.form.controls.projectId.clearValidators();
      this.form.controls.specialtyId.setValidators([Validators.required]);
      this.form.controls.opportunity.setValidators([Validators.required]);
      this.form.controls.maturityLevel.setValidators([Validators.required]);
      this.form.controls.potentialImpact.setValidators([Validators.required]);
      this.form.controls.startDate.setValidators([Validators.required]);
      this.form.controls.expectedEndDate.setValidators([Validators.required]);
      this.form.controls.progress.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
      this.form.controls.status.setValidators([Validators.required]);
      this.form.controls.jalonId.setValidators([Validators.required]);
    } else if (type === 'AUDIT') {
      this.form.controls.entityId.clearValidators();
      this.form.controls.ownerId.clearValidators();
      this.form.controls.startDate.clearValidators();
      this.form.controls.expectedEndDate.clearValidators();
      this.form.controls.progress.clearValidators();
      this.form.controls.status.clearValidators();
      this.form.controls.jalonId.clearValidators();
      this.form.controls.auditId.setValidators([Validators.required]);
      this.form.controls.specialtyId.setValidators([Validators.required]);
      this.form.controls.projectId.clearValidators();
      this.form.controls.watchId.clearValidators();
      this.form.controls.identification.clearValidators();
      this.form.controls.topic.clearValidators();
      this.form.controls.source.clearValidators();
      this.form.controls.opportunity.clearValidators();
      this.form.controls.maturityLevel.clearValidators();
      this.form.controls.potentialImpact.clearValidators();
      this.form.controls.equipmentId.clearValidators();
    } else {
      this.form.controls.entityId.clearValidators();
      this.form.controls.ownerId.setValidators([Validators.required]);
      this.form.controls.projectId.setValidators([Validators.required]);
      this.form.controls.startDate.setValidators([Validators.required]);
      this.form.controls.expectedEndDate.setValidators([Validators.required]);
      this.form.controls.progress.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
      this.form.controls.status.setValidators([Validators.required]);
      this.form.controls.jalonId.setValidators([Validators.required]);
      this.form.controls.auditId.clearValidators();
      this.form.controls.watchId.clearValidators();
      this.form.controls.identification.clearValidators();
      this.form.controls.topic.clearValidators();
      this.form.controls.source.clearValidators();
      this.form.controls.equipmentId.clearValidators();
      this.form.controls.specialtyId.setValidators([Validators.required]);
      this.form.controls.opportunity.clearValidators();
      this.form.controls.maturityLevel.clearValidators();
      this.form.controls.potentialImpact.clearValidators();
    }
    this.form.controls.projectId.updateValueAndValidity({ emitEvent: false });
    this.form.controls.entityId.updateValueAndValidity({ emitEvent: false });
    this.form.controls.auditId.updateValueAndValidity({ emitEvent: false });
    this.form.controls.watchId.updateValueAndValidity({ emitEvent: false });
    this.form.controls.identification.updateValueAndValidity({ emitEvent: false });
    this.form.controls.topic.updateValueAndValidity({ emitEvent: false });
    this.form.controls.source.updateValueAndValidity({ emitEvent: false });
    this.form.controls.equipmentId.updateValueAndValidity({ emitEvent: false });
    this.form.controls.specialtyId.updateValueAndValidity({ emitEvent: false });
    this.form.controls.opportunity.updateValueAndValidity({ emitEvent: false });
    this.form.controls.maturityLevel.updateValueAndValidity({ emitEvent: false });
    this.form.controls.potentialImpact.updateValueAndValidity({ emitEvent: false });
    this.form.controls.startDate.updateValueAndValidity({ emitEvent: false });
    this.form.controls.expectedEndDate.updateValueAndValidity({ emitEvent: false });
    this.form.controls.progress.updateValueAndValidity({ emitEvent: false });
    this.form.controls.status.updateValueAndValidity({ emitEvent: false });
    this.form.controls.jalonId.updateValueAndValidity({ emitEvent: false });
    this.form.controls.ownerId.updateValueAndValidity({ emitEvent: false });
  }

}
