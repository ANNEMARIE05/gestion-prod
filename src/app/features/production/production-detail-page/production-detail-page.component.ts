import { Component, OnInit, inject } from '@angular/core';

import { CommonModule } from '@angular/common';

import { ActivatedRoute, RouterModule } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';

import { MatIconModule } from '@angular/material/icon';

import { ProductionService } from '../../../services/production.service';

import { SettingsService } from '../../../services/settings.service';

import { ProductionItem } from '../../../models/production';



@Component({

  selector: 'app-production-detail-page',

  standalone: true,

  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule],

  templateUrl: './production-detail-page.component.html',

  styleUrl: './production-detail-page.component.scss'

})

export class ProductionDetailPageComponent implements OnInit {

  private readonly settingsService = inject(SettingsService);



  item: ProductionItem | undefined;



  constructor(

    private route: ActivatedRoute,

    private productionService: ProductionService

  ) {}



  ngOnInit(): void {

    const id = this.route.snapshot.paramMap.get('id');

    if (id) {

      this.item = this.productionService.allProductionItems().find(i => i.id === id);

    }

  }



  get backRoute(): string {

    switch (this.item?.type) {

      case 'AUDIT':

        return '/production/audits';

      case 'ENGINEERING':

      case 'MONITORING':

        return '/production/veille';

      default:

        return '/production/projets';

    }

  }



  get typeLabel(): string {

    switch (this.item?.type) {

      case 'AUDIT':

        return 'Audit IT';

      case 'ENGINEERING':

      case 'MONITORING':

        return 'Ingénierie & veille';

      default:

        return 'Projet';

    }

  }



  userDisplayName(idOrLegacy: string): string {

    const users = this.settingsService.allUsers();

    return users.find(u => u.id === idOrLegacy || u.name === idOrLegacy)?.name ?? idOrLegacy;

  }



  initials(label: string): string {

    const parts = label.trim().split(/\s+/).filter(Boolean);

    if (parts.length >= 2) {

      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();

    }

    return label.substring(0, 2).toUpperCase();

  }

}

