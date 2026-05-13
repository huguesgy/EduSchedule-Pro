from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch

def generate_report():
    file_path = "/home/Archux/Projects/Developpement Web/Rapport_Conception_EduSchedule_Pro.pdf"
    doc = SimpleDocTemplate(file_path, pagesize=letter)
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        'MainTitle',
        parent=styles['Title'],
        fontSize=24,
        spaceAfter=30,
        textColor=colors.HexColor('#2E3192')
    )
    
    h1_style = ParagraphStyle(
        'Heading1',
        parent=styles['Heading1'],
        fontSize=18,
        spaceBefore=20,
        spaceAfter=12,
        textColor=colors.HexColor('#1B1464')
    )
    
    body_style = styles['Normal']
    body_style.fontSize = 11
    body_style.leading = 14
    
    story = []
    
    # --- Front Page ---
    story.append(Spacer(1, 2 * inch))
    story.append(Paragraph("PROJET EDUSCHEDULE PRO", title_style))
    story.append(Paragraph("Rapport de Conception - Phase 1", styles['Heading2']))
    story.append(Spacer(1, 1 * inch))
    story.append(Paragraph("Modules : Emploi du temps, QR-Pointage, Cahier de texte, Vacation", styles['Normal']))
    story.append(Spacer(1, 0.5 * inch))
    story.append(Paragraph("Établissement : ITRST", styles['Normal']))
    story.append(Paragraph("Année Universitaire : 2025-2026", styles['Normal']))
    story.append(Spacer(1, 2 * inch))
    story.append(Paragraph("Document préparé pour : Dr Wend-Panga Cédric BÉRÉ", styles['Normal']))
    story.append(PageBreak())
    
    # --- 1. Introduction ---
    story.append(Paragraph("1. Introduction", h1_style))
    story.append(Paragraph(
        "Ce document présente la phase de conception du projet EduSchedule Pro. "
        "L'objectif principal est de dématérialiser la gestion académique au sein des établissements "
        "d'enseignement supérieur, en automatisant le suivi des cours, le pointage des enseignants "
        "et le calcul des vacations.", 
        body_style
    ))
    
    # --- 2. Analyse des Besoins ---
    story.append(Paragraph("2. Analyse des Besoins", h1_style))
    needs_data = [
        ["Acteur", "Besoins Principaux"],
        ["Administrateur", "Gestion des référentiels (classes, matières, salles) et planification."],
        ["Enseignant", "Pointage rapide par QR-Code et suivi de ses vacations."],
        ["Délégué", "Tenue numérique du cahier de texte et signature des séances."],
        ["Surveillant", "Contrôle en temps réel de la présence et validation des fiches."],
        ["Comptable", "Validation finale et traitement des paiements des vacations."]
    ]
    t = Table(needs_data, colWidths=[1.5*inch, 4.5*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f2f2f2')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1B1464')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey)
    ]))
    story.append(t)
    
    # --- 3. Diagramme de Cas d'Utilisation ---
    story.append(Paragraph("3. Diagramme de Cas d'Utilisation (UML)", h1_style))
    story.append(Paragraph(
        "Le système s'articule autour de 5 acteurs principaux interagissant avec les modules suivants :",
        body_style
    ))
    story.append(Spacer(1, 10))
    uc_data = [
        ["Module", "Fonctionnalités Clés"],
        ["Gestion Planning", "CRUD Classes/Matières, Détection Conflits, Publication"],
        ["Pointage QR", "Génération Token, Scan Enseignant, Validation Horaire"],
        ["Cahier de Texte", "Saisie Contenu, Objectifs, Doubles Signatures Numériques"],
        ["Vacations", "Calcul Automatique, Workflow Validation (Surveillant -> Comptable)"]
    ]
    t2 = Table(uc_data, colWidths=[1.5*inch, 4.5*inch])
    t2.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f2f2f2')),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey)
    ]))
    story.append(t2)
    
    # --- 4. Modèle Conceptuel de Données (MCD) ---
    story.append(PageBreak())
    story.append(Paragraph("4. Modèle Conceptuel de Données (MCD)", h1_style))
    story.append(Paragraph(
        "La base de données MySQL est structurée pour assurer l'intégrité référentielle et "
        "permettre un suivi historique des séances. Voici les entités principales :",
        body_style
    ))
    
    mcd_data = [
        ["Entité", "Attributs Principaux"],
        ["utilisateurs", "id, nom, prenom, email, mot_de_passe, role"],
        ["classes", "id, nom, filiere, niveau"],
        ["matieres", "id, code, libelle, volume_horaire"],
        ["creneaux", "id, class_id, prof_id, matiere_id, salle_id, jour, h_debut, h_fin"],
        ["seances", "id, creneau_id, date, qr_token, h_debut_reelle, statut"],
        ["cahier_texte", "id, seance_id, contenu, signature_prof, signature_delegue"],
        ["vacations", "id, prof_id, mois, annee, nb_heures, montant, etat"]
    ]
    t3 = Table(mcd_data, colWidths=[1.5*inch, 4.5*inch])
    t3.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f2f2f2')),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold')
    ]))
    story.append(t3)
    
    # --- 5. Architecture Technique ---
    story.append(Paragraph("5. Architecture Technique", h1_style))
    story.append(Paragraph(
        "L'application utilise une architecture client-serveur moderne :",
        body_style
    ))
    story.append(Paragraph("- Backend : PHP (API REST sans framework ou avec Slim/AltoRouter pour la légèreté).", body_style))
    story.append(Paragraph("- Sécurité : Authentification basée sur les tokens JWT.", body_style))
    story.append(Paragraph("- Frontend : React JS avec Bootstrap 5 pour un design responsive ('Mobile First').", body_style))
    story.append(Paragraph("- Base de données : MySQL pour la persistance des données.", body_style))
    
    # --- 6. Maquettes des Interfaces ---
    story.append(Paragraph("6. Maquettes des Interfaces", h1_style))
    story.append(Paragraph(
        "Les interfaces sont conçues pour être intuitives. Le Dashboard affiche des KPI clairs "
        "(heures réalisées, montants en attente). L'emploi du temps est présenté sous forme "
        "de grille hebdomadaire interactive.",
        body_style
    ))
    
    # Build
    doc.build(story)
    return file_path

if __name__ == "__main__":
    path = generate_report()
    print(f"PDF généré avec succès : {path}")
